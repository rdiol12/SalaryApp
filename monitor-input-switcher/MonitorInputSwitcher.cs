// MonitorInputSwitcher - toggle a monitor between two inputs (e.g. VGA <-> HDMI)
// with a global hotkey, using DDC/CI (VESA MCCS VCP code 0x60 "Input Select").
//
// Build with the C# compiler that ships inside Windows (see build.bat).
// Language level kept at C# 5 on purpose - no SDK required.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace MonitorInputSwitcher
{
    internal static class Native
    {
        public delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdc, IntPtr lprcMonitor, IntPtr dwData);

        [DllImport("user32.dll")]
        public static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct PHYSICAL_MONITOR
        {
            public IntPtr hPhysicalMonitor;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
            public string szPhysicalMonitorDescription;
        }

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool GetNumberOfPhysicalMonitorsFromHMONITOR(IntPtr hMonitor, out uint count);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool GetPhysicalMonitorsFromHMONITOR(IntPtr hMonitor, uint arraySize, [Out] PHYSICAL_MONITOR[] arr);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool DestroyPhysicalMonitors(uint arraySize, PHYSICAL_MONITOR[] arr);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool GetVCPFeatureAndVCPFeatureReply(IntPtr hMonitor, byte code, out uint vcpType, out uint current, out uint max);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool SetVCPFeature(IntPtr hMonitor, byte code, uint value);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool GetCapabilitiesStringLength(IntPtr hMonitor, out uint length);

        [DllImport("dxva2.dll", SetLastError = true)]
        public static extern bool CapabilitiesRequestAndCapabilitiesReply(IntPtr hMonitor, StringBuilder buffer, uint length);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint modifiers, uint vk);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        public static extern short GetAsyncKeyState(int vKey);

        [DllImport("kernel32.dll")]
        public static extern bool AttachConsole(int processId);

        [DllImport("kernel32.dll")]
        public static extern bool AllocConsole();

        public const int WM_HOTKEY = 0x0312;
        public const byte VCP_INPUT_SELECT = 0x60;

        public const uint MOD_ALT = 0x0001;
        public const uint MOD_CONTROL = 0x0002;
        public const uint MOD_SHIFT = 0x0004;
        public const uint MOD_WIN = 0x0008;
        public const uint MOD_NOREPEAT = 0x4000;

        public const int VK_LWIN = 0x5B;
        public const int VK_RWIN = 0x5C;
    }

    /// <summary>Open set of physical monitors. Opened fresh for every operation so that
    /// sleep / replug / resolution changes cannot leave us holding stale handles.</summary>
    internal sealed class MonitorSet : IDisposable
    {
        public sealed class Item
        {
            public IntPtr Handle;
            public string Description;
            public int Index;
        }

        private readonly List<Native.PHYSICAL_MONITOR[]> _arrays = new List<Native.PHYSICAL_MONITOR[]>();
        public readonly List<Item> Items = new List<Item>();

        public static MonitorSet Open()
        {
            MonitorSet set = new MonitorSet();
            List<IntPtr> screens = new List<IntPtr>();

            Native.MonitorEnumProc cb = delegate(IntPtr hMon, IntPtr hdc, IntPtr rect, IntPtr data)
            {
                screens.Add(hMon);
                return true;
            };
            Native.EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, cb, IntPtr.Zero);

            foreach (IntPtr hMon in screens)
            {
                uint count;
                if (!Native.GetNumberOfPhysicalMonitorsFromHMONITOR(hMon, out count) || count == 0)
                    continue;

                Native.PHYSICAL_MONITOR[] arr = new Native.PHYSICAL_MONITOR[count];
                if (!Native.GetPhysicalMonitorsFromHMONITOR(hMon, count, arr))
                    continue;

                set._arrays.Add(arr);
                for (int i = 0; i < arr.Length; i++)
                {
                    Item item = new Item();
                    item.Handle = arr[i].hPhysicalMonitor;
                    item.Description = arr[i].szPhysicalMonitorDescription;
                    item.Index = set.Items.Count;
                    set.Items.Add(item);
                }
            }
            return set;
        }

        public void Dispose()
        {
            for (int i = 0; i < _arrays.Count; i++)
            {
                try { Native.DestroyPhysicalMonitors((uint)_arrays[i].Length, _arrays[i]); }
                catch { }
            }
            _arrays.Clear();
            Items.Clear();
        }
    }

    internal static class Ddc
    {
        public static bool TryReadInput(IntPtr handle, out uint value)
        {
            uint vcpType, max;
            value = 0;
            for (int attempt = 0; attempt < 3; attempt++)
            {
                uint current;
                if (Native.GetVCPFeatureAndVCPFeatureReply(handle, Native.VCP_INPUT_SELECT, out vcpType, out current, out max))
                {
                    value = current & 0xFF;
                    return true;
                }
                Thread.Sleep(60);
            }
            return false;
        }

        public static bool TryWriteInput(IntPtr handle, uint value)
        {
            for (int attempt = 0; attempt < 3; attempt++)
            {
                if (Native.SetVCPFeature(handle, Native.VCP_INPUT_SELECT, value))
                    return true;
                Thread.Sleep(80);
            }
            return false;
        }

        public static string ReadCapabilities(IntPtr handle)
        {
            uint length;
            if (!Native.GetCapabilitiesStringLength(handle, out length) || length == 0 || length > 64 * 1024)
                return null;
            StringBuilder sb = new StringBuilder((int)length);
            if (!Native.CapabilitiesRequestAndCapabilitiesReply(handle, sb, length))
                return null;
            return sb.ToString();
        }
    }

    internal sealed class Config
    {
        public uint InputA = 0x01;              // VGA / analog 1
        public uint InputB = 0x11;              // HDMI 1
        public string InputAName = "VGA";
        public string InputBName = "HDMI";
        public uint Modifiers = Native.MOD_CONTROL | Native.MOD_ALT;
        public uint VirtualKey = (uint)Keys.F12;
        public string HotkeyText = "Ctrl+Alt+F12";
        public int MonitorIndex = -1;           // -1 = every monitor currently on InputA or InputB
        public bool Notify = true;

        public static string DefaultPath()
        {
            string exe = Application.ExecutablePath;
            return Path.Combine(Path.GetDirectoryName(exe), "switcher.ini");
        }

        private const string Template =
@"; MonitorInputSwitcher settings
; Input codes are VESA MCCS values for VCP 0x60 (Input Select).
; Common ones: vga=0x01  dvi1=0x03  dvi2=0x04  dp1=0x0F  dp2=0x10  hdmi1=0x11  hdmi2=0x12
; Monitors do not all follow the standard. Run ""MonitorInputSwitcher.exe --probe""
; while on each input to read the real numbers off your monitor.

inputA = vga
inputB = hdmi1

; Names used in the tray menu and notifications.
nameA = VGA
nameB = HDMI

; Easiest way to change this: right-click the tray icon and pick ""Set hotkey..."",
; which records whatever you press and writes it back here.
; By hand: ctrl, alt, shift, win as modifiers, plus a key - F1-F24, a letter,
; a digit, or a name such as PrintScreen, Insert, Home, Pause, NumPad0.
hotkey = Ctrl+Alt+F12

; -1 = switch every monitor that is currently on inputA or inputB (safe default).
; 0, 1, 2 ... = only that monitor, as numbered by --probe.
monitor = -1

; Show a tray balloon after each switch.
notify = true
";

        public static Config Load(string path, out string error)
        {
            error = null;
            Config cfg = new Config();
            try
            {
                if (!File.Exists(path))
                {
                    File.WriteAllText(path, Template);
                    return cfg;
                }

                foreach (string raw in File.ReadAllLines(path))
                {
                    string line = raw.Trim();
                    if (line.Length == 0 || line.StartsWith(";") || line.StartsWith("#") || line.StartsWith("["))
                        continue;
                    int eq = line.IndexOf('=');
                    if (eq <= 0) continue;

                    string key = line.Substring(0, eq).Trim().ToLowerInvariant();
                    string val = line.Substring(eq + 1).Trim();
                    int semi = val.IndexOf(';');
                    if (semi >= 0) val = val.Substring(0, semi).Trim();
                    if (val.Length == 0) continue;

                    switch (key)
                    {
                        case "inputa":
                            cfg.InputA = ParseInput(val);
                            break;
                        case "inputb":
                            cfg.InputB = ParseInput(val);
                            break;
                        case "namea":
                            cfg.InputAName = val;
                            break;
                        case "nameb":
                            cfg.InputBName = val;
                            break;
                        case "hotkey":
                        {
                            uint mods, vk;
                            if (ParseHotkey(val, out mods, out vk))
                            {
                                cfg.Modifiers = mods;
                                cfg.VirtualKey = vk;
                                cfg.HotkeyText = val;
                            }
                            else
                            {
                                error = "Could not understand hotkey \"" + val + "\"; using " + cfg.HotkeyText + ".";
                            }
                            break;
                        }
                        case "monitor":
                        {
                            int idx;
                            if (int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out idx))
                                cfg.MonitorIndex = idx;
                            break;
                        }
                        case "notify":
                            cfg.Notify = !(val.Equals("false", StringComparison.OrdinalIgnoreCase)
                                        || val.Equals("0", StringComparison.Ordinal)
                                        || val.Equals("no", StringComparison.OrdinalIgnoreCase));
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                error = "Could not read " + path + ": " + ex.Message;
            }
            return cfg;
        }

        public static uint ParseInput(string text)
        {
            string s = text.Trim().ToLowerInvariant().Replace("-", "").Replace("_", "").Replace(" ", "");
            switch (s)
            {
                case "vga": case "analog": case "analog1": case "rgb1": return 0x01;
                case "vga2": case "analog2": case "rgb2": return 0x02;
                case "dvi": case "dvi1": return 0x03;
                case "dvi2": return 0x04;
                case "composite": case "composite1": return 0x05;
                case "svideo": case "svideo1": return 0x07;
                case "component": case "ypbpr": return 0x0D;
                case "dp": case "displayport": case "dp1": case "displayport1": return 0x0F;
                case "dp2": case "displayport2": return 0x10;
                case "hdmi": case "hdmi1": return 0x11;
                case "hdmi2": return 0x12;
                case "usbc": case "typec": return 0x1B;   // non-standard, varies by vendor
            }
            if (s.StartsWith("0x"))
                return uint.Parse(s.Substring(2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
            return uint.Parse(s, CultureInfo.InvariantCulture);
        }

        /// <summary>"Ctrl+Alt+F12" from a modifier mask and a virtual key, in a form ParseHotkey reads back.</summary>
        public static string CanonicalText(uint mods, uint vk)
        {
            StringBuilder sb = new StringBuilder();
            if ((mods & Native.MOD_CONTROL) != 0) sb.Append("Ctrl+");
            if ((mods & Native.MOD_ALT) != 0) sb.Append("Alt+");
            if ((mods & Native.MOD_SHIFT) != 0) sb.Append("Shift+");
            if ((mods & Native.MOD_WIN) != 0) sb.Append("Win+");
            sb.Append(KeyName(vk));
            return sb.ToString();
        }

        public static string KeyName(uint vk)
        {
            Keys k = (Keys)vk;
            if (k >= Keys.D0 && k <= Keys.D9)
                return ((char)('0' + (int)(k - Keys.D0))).ToString();
            return k.ToString();
        }

        /// <summary>Rewrites just the hotkey line in switcher.ini, leaving comments and other settings alone.</summary>
        public static bool SaveHotkey(string path, string hotkeyText, out string error)
        {
            error = null;
            try
            {
                List<string> lines = new List<string>();
                if (!File.Exists(path))
                    File.WriteAllText(path, Template);
                lines.AddRange(File.ReadAllLines(path));

                bool replaced = false;
                for (int i = 0; i < lines.Count; i++)
                {
                    string t = lines[i].TrimStart();
                    if (t.Length == 0 || t.StartsWith(";") || t.StartsWith("#") || t.StartsWith("["))
                        continue;
                    int eq = t.IndexOf('=');
                    if (eq <= 0) continue;
                    if (t.Substring(0, eq).Trim().ToLowerInvariant() != "hotkey") continue;
                    lines[i] = "hotkey = " + hotkeyText;
                    replaced = true;
                    break;
                }
                if (!replaced) lines.Add("hotkey = " + hotkeyText);

                File.WriteAllLines(path, lines.ToArray());
                return true;
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return false;
            }
        }

        public static bool ParseHotkey(string text, out uint modifiers, out uint vk)
        {
            modifiers = 0;
            vk = 0;
            string[] parts = text.Split(new char[] { '+' }, StringSplitOptions.RemoveEmptyEntries);
            string keyToken = null;

            foreach (string part in parts)
            {
                string t = part.Trim();
                string low = t.ToLowerInvariant();
                if (low == "ctrl" || low == "control") modifiers |= Native.MOD_CONTROL;
                else if (low == "alt") modifiers |= Native.MOD_ALT;
                else if (low == "shift") modifiers |= Native.MOD_SHIFT;
                else if (low == "win" || low == "super" || low == "meta") modifiers |= Native.MOD_WIN;
                else keyToken = t;
            }
            if (keyToken == null) return false;

            string k = keyToken;
            if (k.Length == 1 && char.IsDigit(k[0])) k = "D" + k;
            if (k.Equals("prtsc", StringComparison.OrdinalIgnoreCase) || k.Equals("printscr", StringComparison.OrdinalIgnoreCase)) k = "PrintScreen";
            if (k.Equals("pgup", StringComparison.OrdinalIgnoreCase)) k = "PageUp";
            if (k.Equals("pgdn", StringComparison.OrdinalIgnoreCase) || k.Equals("pgdown", StringComparison.OrdinalIgnoreCase)) k = "PageDown";
            if (k.Equals("esc", StringComparison.OrdinalIgnoreCase)) k = "Escape";
            if (k.Equals("del", StringComparison.OrdinalIgnoreCase)) k = "Delete";
            if (k.Equals("ins", StringComparison.OrdinalIgnoreCase)) k = "Insert";
            if (k.Equals("scroll", StringComparison.OrdinalIgnoreCase)) k = "Scroll";

            try
            {
                Keys parsed = (Keys)Enum.Parse(typeof(Keys), k, true);
                if (parsed == Keys.None) return false;
                vk = (uint)parsed;
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>Modal dialog that records a key combination as the user presses it.</summary>
    internal sealed class HotkeyPicker : Form
    {
        public uint Modifiers;
        public uint VirtualKey;
        public string HotkeyText = "";

        private readonly TextBox _box;
        private readonly Label _hint;

        public HotkeyPicker(string currentText)
        {
            Text = "Choose the hotkey";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterScreen;
            MaximizeBox = false;
            MinimizeBox = false;
            ShowIcon = false;
            ShowInTaskbar = false;
            ClientSize = new System.Drawing.Size(430, 185);
            KeyPreview = true;

            Label title = new Label();
            title.Text = "Press the key combination you want, then click Save.";
            title.SetBounds(12, 12, 406, 20);

            _box = new TextBox();
            _box.ReadOnly = true;
            _box.ShortcutsEnabled = false;
            _box.TextAlign = HorizontalAlignment.Center;
            _box.Font = new System.Drawing.Font(Font.FontFamily, 12f, System.Drawing.FontStyle.Bold);
            _box.Text = currentText;
            _box.SetBounds(12, 38, 406, 32);

            _hint = new Label();
            _hint.SetBounds(12, 80, 406, 56);
            _hint.Text = "In use now: " + currentText +
                         "\r\nCtrl, Alt, Shift and Win all work as modifiers. Windows keeps some " +
                         "combinations for itself and will not hand those over.";

            Button save = new Button();
            save.Text = "Save";
            save.SetBounds(236, 145, 88, 28);
            save.Click += delegate { Accept(); };

            Button cancel = new Button();
            cancel.Text = "Cancel";
            cancel.SetBounds(330, 145, 88, 28);
            cancel.Click += delegate { DialogResult = DialogResult.Cancel; Close(); };

            Controls.Add(title);
            Controls.Add(_box);
            Controls.Add(_hint);
            Controls.Add(save);
            Controls.Add(cancel);
        }

        private void Accept()
        {
            if (VirtualKey == 0)
            {
                _hint.Text = "Press a key combination first - one with Ctrl, Alt, Shift or Win, or a function key.";
                return;
            }
            DialogResult = DialogResult.OK;
            Close();
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            Keys key = keyData & Keys.KeyCode;

            if (key == Keys.Escape && (keyData & Keys.Modifiers) == Keys.None)
            {
                DialogResult = DialogResult.Cancel;
                Close();
                return true;
            }

            // A modifier on its own is not a hotkey - keep waiting for the real key.
            if (key == Keys.None || key == Keys.ControlKey || key == Keys.Menu || key == Keys.ShiftKey
                || key == Keys.LControlKey || key == Keys.RControlKey || key == Keys.LMenu || key == Keys.RMenu
                || key == Keys.LShiftKey || key == Keys.RShiftKey || key == Keys.LWin || key == Keys.RWin
                || key == Keys.Capital || key == Keys.NumLock || key == Keys.Scroll)
            {
                return true;
            }

            uint mods = 0;
            if ((keyData & Keys.Control) == Keys.Control) mods |= Native.MOD_CONTROL;
            if ((keyData & Keys.Alt) == Keys.Alt) mods |= Native.MOD_ALT;
            if ((keyData & Keys.Shift) == Keys.Shift) mods |= Native.MOD_SHIFT;
            // Keys has no flag for the Windows key, so ask the keyboard directly.
            if ((Native.GetAsyncKeyState(Native.VK_LWIN) & 0x8000) != 0
                || (Native.GetAsyncKeyState(Native.VK_RWIN) & 0x8000) != 0)
                mods |= Native.MOD_WIN;

            bool functionKey = key >= Keys.F1 && key <= Keys.F24;

            if (mods == 0 && !functionKey)
            {
                VirtualKey = 0;
                _box.Text = Config.KeyName((uint)key);
                _hint.Text = "Add Ctrl, Alt, Shift or Win to that - a bare key would fire while you type. " +
                             "Function keys F1-F24 are fine on their own.";
                return true;
            }

            Modifiers = mods;
            VirtualKey = (uint)key;
            HotkeyText = Config.CanonicalText(mods, (uint)key);
            _box.Text = HotkeyText;
            _hint.Text = "Click Save to use " + HotkeyText + ".";
            return true;
        }
    }

    internal sealed class MessageWindow : NativeWindow
    {
        public event EventHandler HotkeyPressed;

        public MessageWindow()
        {
            CreateParams cp = new CreateParams();
            cp.Caption = "MonitorInputSwitcherHotkeyWindow";
            CreateHandle(cp);
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == Native.WM_HOTKEY)
            {
                EventHandler h = HotkeyPressed;
                if (h != null) h(this, EventArgs.Empty);
            }
            base.WndProc(ref m);
        }
    }

    internal sealed class SwitcherContext : ApplicationContext
    {
        private const int HotkeyId = 0xB00B;

        private readonly MessageWindow _window;
        private readonly NotifyIcon _tray;
        private Config _cfg;
        private bool _hotkeyOk;
        private uint _lastTarget;

        public SwitcherContext()
        {
            _window = new MessageWindow();
            _window.HotkeyPressed += delegate { Toggle(); };

            _tray = new NotifyIcon();
            _tray.Icon = System.Drawing.SystemIcons.Information;
            _tray.Visible = true;
            _tray.DoubleClick += delegate { Toggle(); };

            LoadConfig(true);
            BuildMenu();
        }

        private void LoadConfig(bool firstTime)
        {
            string error;
            _cfg = Config.Load(Config.DefaultPath(), out error);
            _lastTarget = _cfg.InputB;

            RegisterCurrent();
            UpdateTrayText();

            if (error != null)
                Warn(error);

            if (!_hotkeyOk)
            {
                Warn("Windows refused the hotkey " + _cfg.HotkeyText +
                     " - something else has already claimed it.\r\n\r\n" +
                     "Right-click the tray icon and choose \"Set hotkey...\" to pick a different one. " +
                     "The tray menu still works in the meantime.");
            }
            else if (firstTime && _cfg.Notify)
            {
                Balloon("Ready", _cfg.HotkeyText + " toggles " + _cfg.InputAName + " / " + _cfg.InputBName +
                                 ". Right-click the icon to change it.");
            }
        }

        private bool RegisterCurrent()
        {
            if (_hotkeyOk)
            {
                Native.UnregisterHotKey(_window.Handle, HotkeyId);
                _hotkeyOk = false;
            }
            _hotkeyOk = Native.RegisterHotKey(_window.Handle, HotkeyId,
                                              _cfg.Modifiers | Native.MOD_NOREPEAT, _cfg.VirtualKey);
            return _hotkeyOk;
        }

        private void UpdateTrayText()
        {
            string text = "Monitor input switcher - " + (_hotkeyOk ? _cfg.HotkeyText : "hotkey unavailable");
            if (text.Length > 63) text = text.Substring(0, 63);
            _tray.Text = text;
        }

        /// <summary>Let the user press a new combination, prove Windows will give it to us, then persist it.</summary>
        private void PickHotkey()
        {
            using (HotkeyPicker picker = new HotkeyPicker(_cfg.HotkeyText))
            {
                if (picker.ShowDialog() != DialogResult.OK)
                    return;

                uint oldMods = _cfg.Modifiers;
                uint oldVk = _cfg.VirtualKey;
                string oldText = _cfg.HotkeyText;

                if (_hotkeyOk)
                {
                    Native.UnregisterHotKey(_window.Handle, HotkeyId);
                    _hotkeyOk = false;
                }

                if (!Native.RegisterHotKey(_window.Handle, HotkeyId,
                                           picker.Modifiers | Native.MOD_NOREPEAT, picker.VirtualKey))
                {
                    // Put the old one back so the program stays usable.
                    _cfg.Modifiers = oldMods;
                    _cfg.VirtualKey = oldVk;
                    _cfg.HotkeyText = oldText;
                    RegisterCurrent();
                    UpdateTrayText();
                    Warn(picker.HotkeyText + " is already taken by another program, or Windows keeps it for itself." +
                         "\r\n\r\nStill using " + oldText + ". Try another combination.");
                    return;
                }

                _hotkeyOk = true;
                _cfg.Modifiers = picker.Modifiers;
                _cfg.VirtualKey = picker.VirtualKey;
                _cfg.HotkeyText = picker.HotkeyText;

                string error;
                if (!Config.SaveHotkey(Config.DefaultPath(), picker.HotkeyText, out error))
                {
                    Warn("The hotkey works now, but it could not be written to switcher.ini, so it will be " +
                         "back to " + oldText + " next time you start the program.\r\n\r\n" + error);
                }

                UpdateTrayText();
                BuildMenu();
                if (_cfg.Notify)
                    Balloon("Hotkey set", picker.HotkeyText + " now toggles " + _cfg.InputAName + " / " + _cfg.InputBName + ".");
            }
        }

        private void BuildMenu()
        {
            ContextMenuStrip previous = _tray.ContextMenuStrip;
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("Toggle input" + (_hotkeyOk ? " (" + _cfg.HotkeyText + ")" : ""), null, delegate { Toggle(); });
            menu.Items.Add("Switch to " + _cfg.InputAName, null, delegate { SetInput(_cfg.InputA, _cfg.InputAName); });
            menu.Items.Add("Switch to " + _cfg.InputBName, null, delegate { SetInput(_cfg.InputB, _cfg.InputBName); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Set hotkey...", null, delegate { PickHotkey(); });
            menu.Items.Add("Show monitor info...", null, delegate { ShowProbe(); });
            menu.Items.Add("Edit settings...", null, delegate { EditConfig(); });
            menu.Items.Add("Reload settings", null, delegate { LoadConfig(false); BuildMenu(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Exit", null, delegate { ExitThread(); });
            _tray.ContextMenuStrip = menu;
            if (previous != null) previous.Dispose();
        }

        private string NameOf(uint code)
        {
            if (code == _cfg.InputA) return _cfg.InputAName;
            if (code == _cfg.InputB) return _cfg.InputBName;
            return "0x" + code.ToString("X2", CultureInfo.InvariantCulture);
        }

        private void Toggle()
        {
            using (MonitorSet set = MonitorSet.Open())
            {
                List<MonitorSet.Item> targets = Select(set);
                if (targets.Count == 0)
                {
                    Warn("There is no monitor at index " + _cfg.MonitorIndex +
                         ". Use \"Show monitor info\" to see how the monitors are numbered.");
                    return;
                }

                int answered = 0;    // monitors that replied to the read
                int matched = 0;     // monitors sitting on inputA or inputB
                int done = 0;        // monitors that accepted the change
                uint lastSet = 0;
                List<string> seen = new List<string>();

                foreach (MonitorSet.Item m in targets)
                {
                    uint current;
                    uint target;

                    if (Ddc.TryReadInput(m.Handle, out current))
                    {
                        answered++;
                        seen.Add("monitor " + m.Index + " is on 0x" + current.ToString("X2"));

                        if (current == _cfg.InputA) target = _cfg.InputB;
                        else if (current == _cfg.InputB) target = _cfg.InputA;
                        else if (_cfg.MonitorIndex >= 0) target = _cfg.InputA;
                        else continue;   // auto mode: on some other input, leave it alone
                        matched++;
                    }
                    else
                    {
                        // Monitor will not report its input. Only guess when a monitor was pinned.
                        if (_cfg.MonitorIndex < 0) continue;
                        target = (_lastTarget == _cfg.InputA) ? _cfg.InputB : _cfg.InputA;
                        matched++;
                    }

                    if (Ddc.TryWriteInput(m.Handle, target))
                    {
                        _lastTarget = target;
                        lastSet = target;
                        done++;
                    }
                }

                if (done > 0)
                {
                    if (_cfg.Notify) Balloon("Switched", "Monitor input -> " + NameOf(lastSet));
                }
                else if (answered == 0)
                {
                    Warn("No monitor answered on DDC/CI.\r\n\r\n" +
                         "Enable DDC/CI in the monitor's own menu, and check that the cable goes straight " +
                         "to the graphics card - docks, display adapters, HDMI switches and KVMs usually " +
                         "drop the control channel. See the README.");
                }
                else if (matched == 0)
                {
                    Warn("The monitor is answering, but not on either of the inputs in switcher.ini.\r\n\r\n" +
                         string.Join("\r\n", seen.ToArray()) + "\r\n\r\n" +
                         "switcher.ini has " + _cfg.InputAName + " = 0x" + _cfg.InputA.ToString("X2") +
                         " and " + _cfg.InputBName + " = 0x" + _cfg.InputB.ToString("X2") + ".\r\n\r\n" +
                         "Put the number shown above into switcher.ini for the input you are looking at now.");
                }
                else
                {
                    Warn("The monitor answered but refused the input change.\r\n\r\n" +
                         string.Join("\r\n", seen.ToArray()) + "\r\n\r\n" +
                         "Some monitors only accept inputs that are actually plugged in, and some need " +
                         "DDC/CI writes enabled in their menu.");
                }
            }
        }

        private void SetInput(uint code, string name)
        {
            using (MonitorSet set = MonitorSet.Open())
            {
                List<MonitorSet.Item> targets = Select(set);
                int done = 0;
                foreach (MonitorSet.Item m in targets)
                {
                    uint current;
                    bool readable = Ddc.TryReadInput(m.Handle, out current);
                    if (_cfg.MonitorIndex < 0 && readable && current != _cfg.InputA && current != _cfg.InputB)
                        continue;
                    if (Ddc.TryWriteInput(m.Handle, code))
                    {
                        _lastTarget = code;
                        done++;
                    }
                }
                if (done > 0)
                {
                    if (_cfg.Notify) Balloon("Switched", "Monitor input -> " + name);
                }
                else
                {
                    Warn("Could not set the input to " + name + " (0x" + code.ToString("X2") + ").");
                }
            }
        }

        private List<MonitorSet.Item> Select(MonitorSet set)
        {
            List<MonitorSet.Item> list = new List<MonitorSet.Item>();
            if (_cfg.MonitorIndex >= 0)
            {
                if (_cfg.MonitorIndex < set.Items.Count)
                    list.Add(set.Items[_cfg.MonitorIndex]);
            }
            else
            {
                list.AddRange(set.Items);
            }
            return list;
        }

        private void ShowProbe()
        {
            string report = Program.BuildReport();
            Form dialog = new Form();
            dialog.Text = "Monitor info";
            dialog.StartPosition = FormStartPosition.CenterScreen;
            dialog.Width = 760;
            dialog.Height = 520;
            dialog.ShowIcon = false;

            TextBox box = new TextBox();
            box.Multiline = true;
            box.ReadOnly = true;
            box.ScrollBars = ScrollBars.Both;
            box.WordWrap = false;
            box.Dock = DockStyle.Fill;
            box.Font = new System.Drawing.Font("Consolas", 9f);
            box.Text = report;
            dialog.Controls.Add(box);
            dialog.ShowDialog();
        }

        private void EditConfig()
        {
            string path = Config.DefaultPath();
            try
            {
                if (!File.Exists(path))
                {
                    string ignored;
                    Config.Load(path, out ignored);
                }
                Process.Start("notepad.exe", "\"" + path + "\"");
            }
            catch (Exception ex)
            {
                Warn("Could not open " + path + ": " + ex.Message);
            }
        }

        private void Balloon(string title, string text)
        {
            try
            {
                _tray.BalloonTipTitle = title;
                _tray.BalloonTipText = text;
                _tray.ShowBalloonTip(2500);
            }
            catch { }
        }

        private void Warn(string text)
        {
            MessageBox.Show(text, "Monitor input switcher", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (_hotkeyOk) Native.UnregisterHotKey(_window.Handle, HotkeyId);
                _tray.Visible = false;
                _tray.Dispose();
                _window.DestroyHandle();
            }
            base.Dispose(disposing);
        }
    }

    internal static class Program
    {
        public static string BuildReport()
        {
            StringBuilder sb = new StringBuilder();
            string error;
            Config cfg = Config.Load(Config.DefaultPath(), out error);

            sb.AppendLine("Settings file : " + Config.DefaultPath());
            sb.AppendLine("Hotkey        : " + cfg.HotkeyText);
            sb.AppendLine("inputA        : " + cfg.InputAName + " = 0x" + cfg.InputA.ToString("X2"));
            sb.AppendLine("inputB        : " + cfg.InputBName + " = 0x" + cfg.InputB.ToString("X2"));
            sb.AppendLine("monitor       : " + (cfg.MonitorIndex < 0 ? "-1 (auto)" : cfg.MonitorIndex.ToString()));
            sb.AppendLine();

            using (MonitorSet set = MonitorSet.Open())
            {
                if (set.Items.Count == 0)
                {
                    sb.AppendLine("No physical monitors were returned by Windows.");
                    return sb.ToString();
                }

                foreach (MonitorSet.Item m in set.Items)
                {
                    sb.AppendLine("monitor " + m.Index + ": " + m.Description);

                    uint current;
                    if (Ddc.TryReadInput(m.Handle, out current))
                    {
                        sb.AppendLine("  current input (VCP 0x60) = 0x" + current.ToString("X2") +
                                      "  (" + current.ToString(CultureInfo.InvariantCulture) + " decimal)");
                        sb.AppendLine("  -> this is the number to put in switcher.ini for the input you are looking at now");
                    }
                    else
                    {
                        sb.AppendLine("  current input: NO ANSWER - DDC/CI off in the monitor menu, or this link");
                        sb.AppendLine("     carries no usable data channel (common on VGA and on adapters/KVMs).");
                    }

                    string caps = Ddc.ReadCapabilities(m.Handle);
                    if (caps != null)
                    {
                        int at = caps.IndexOf("60(", StringComparison.Ordinal);
                        if (at >= 0)
                        {
                            int close = caps.IndexOf(')', at);
                            if (close > at)
                                sb.AppendLine("  inputs the monitor advertises: " + caps.Substring(at, close - at + 1));
                        }
                        sb.AppendLine("  capabilities string:");
                        sb.AppendLine("  " + caps.Replace("\r", " ").Replace("\n", " "));
                    }
                    else
                    {
                        sb.AppendLine("  capabilities string: not available");
                    }
                    sb.AppendLine();
                }
            }

            sb.AppendLine("Standard VCP 0x60 values: 0x01 VGA  0x03 DVI-1  0x04 DVI-2");
            sb.AppendLine("                          0x0F DP-1  0x10 DP-2  0x11 HDMI-1  0x12 HDMI-2");
            sb.AppendLine("Many monitors ignore the standard, so trust the number read above, not this list.");
            return sb.ToString();
        }

        private static void WriteToConsole(string text)
        {
            if (!Native.AttachConsole(-1))
                Native.AllocConsole();
            try
            {
                StreamWriter w = new StreamWriter(Console.OpenStandardOutput());
                w.AutoFlush = true;
                Console.SetOut(w);
            }
            catch { }
            Console.WriteLine();
            Console.WriteLine(text);
        }

        [STAThread]
        private static int Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string mode = "run";
            uint oneShot = 0;
            for (int i = 0; i < args.Length; i++)
            {
                string a = args[i].TrimStart('-', '/').ToLowerInvariant();
                if (a == "probe" || a == "list" || a == "info") mode = "probe";
                else if (a == "toggle") mode = "toggle";
                else if (a == "a" || a == "inputa") { mode = "set"; oneShot = 1; }
                else if (a == "b" || a == "inputb") { mode = "set"; oneShot = 2; }
                else if (a == "h" || a == "help" || a == "?") mode = "help";
            }

            if (mode == "help")
            {
                WriteToConsole(
                    "MonitorInputSwitcher\r\n\r\n" +
                    "  MonitorInputSwitcher.exe            run in the tray and listen for the hotkey\r\n" +
                    "  MonitorInputSwitcher.exe --probe    list monitors and read their current input code\r\n" +
                    "  MonitorInputSwitcher.exe --toggle   switch once and exit (for your own shortcuts)\r\n" +
                    "  MonitorInputSwitcher.exe --a        switch to inputA once and exit\r\n" +
                    "  MonitorInputSwitcher.exe --b        switch to inputB once and exit\r\n\r\n" +
                    "Settings live in switcher.ini next to the .exe.");
                return 0;
            }

            if (mode == "probe")
            {
                WriteToConsole(BuildReport());
                return 0;
            }

            if (mode == "toggle" || mode == "set")
            {
                string error;
                Config cfg = Config.Load(Config.DefaultPath(), out error);
                int done = 0;
                using (MonitorSet set = MonitorSet.Open())
                {
                    foreach (MonitorSet.Item m in set.Items)
                    {
                        if (cfg.MonitorIndex >= 0 && m.Index != cfg.MonitorIndex) continue;

                        uint current;
                        bool readable = Ddc.TryReadInput(m.Handle, out current);
                        uint target;

                        if (mode == "set")
                        {
                            target = (oneShot == 1) ? cfg.InputA : cfg.InputB;
                            if (cfg.MonitorIndex < 0 && readable && current != cfg.InputA && current != cfg.InputB)
                                continue;
                        }
                        else if (readable)
                        {
                            if (current == cfg.InputA) target = cfg.InputB;
                            else if (current == cfg.InputB) target = cfg.InputA;
                            else if (cfg.MonitorIndex >= 0) target = cfg.InputA;
                            else continue;
                        }
                        else
                        {
                            if (cfg.MonitorIndex < 0) continue;
                            target = cfg.InputB;
                        }

                        if (Ddc.TryWriteInput(m.Handle, target)) done++;
                    }
                }
                return done > 0 ? 0 : 1;
            }

            using (Mutex mutex = new Mutex(false, "MonitorInputSwitcher.SingleInstance"))
            {
                bool mine = false;
                try { mine = mutex.WaitOne(0, false); }
                catch { mine = true; }

                if (!mine)
                {
                    MessageBox.Show("Monitor input switcher is already running - look for it in the notification area.",
                                    "Monitor input switcher", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return 0;
                }

                try
                {
                    Application.Run(new SwitcherContext());
                }
                finally
                {
                    try { mutex.ReleaseMutex(); } catch { }
                }
            }
            return 0;
        }
    }
}
