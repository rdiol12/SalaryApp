# Monitor input switcher (VGA <-> HDMI, global hotkey)

A tiny Windows tray program that flips your monitor between two inputs with one
hotkey. It talks to the monitor over **DDC/CI** — the control channel inside the
video cable — using VESA MCCS feature `0x60` (*Input Select*), the same thing the
monitor's own on-screen menu uses. No driver, no service, no admin rights.

Default hotkey: **Ctrl + Alt + F12** — press it to go VGA -> HDMI, press it again
to come back.

## Get the program

**Option 1 - let GitHub build it (nothing to install).**
Every push that touches this folder runs
[`.github/workflows/monitor-input-switcher.yml`](../.github/workflows/monitor-input-switcher.yml)
on a Windows runner and attaches the compiled program to the run:

1. Open the repository's **Actions** tab.
2. Pick the newest **Build monitor input switcher** run.
3. Scroll to **Artifacts** and download **MonitorInputSwitcher** (a zip with the
   .exe and this README).
4. Unzip it into a folder of its own. Then right-click `MonitorInputSwitcher.exe`,
   choose **Properties**, tick **Unblock** at the bottom, and click OK - Windows
   marks everything downloaded from the internet and will otherwise warn you
   every launch.

You can also start a build yourself from that tab: **Run workflow** on the
*Build monitor input switcher* workflow. Tick **Also publish a GitHub release**
there if you'd rather have a permanent download link under Releases than an
artifact that expires.

**Option 2 - build it on your own machine.** In this folder, run:

```
build.bat
```

That produces `MonitorInputSwitcher.exe` using the C# compiler already inside
Windows (`%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe`), so there is
nothing to install - no Visual Studio, no .NET SDK. The source is deliberately
kept to C# 5 so that compiler can handle it.

## First run — read your monitor's real input numbers

Monitors are supposed to use standard numbers for `0x60`, and plenty of them
don't. Before trusting the defaults, do this:

1. With the monitor showing **HDMI**, open a Command Prompt here and run:
   ```
   MonitorInputSwitcher.exe --probe
   ```
   Note the `current input (VCP 0x60)` value.
2. Switch the monitor to **VGA** with its own buttons, run `--probe` again, and
   note that value too.
3. Put both numbers in `switcher.ini` (created next to the .exe on first run):
   ```ini
   inputA = 0x01     ; whatever VGA reported
   inputB = 0x11     ; whatever HDMI reported
   hotkey = Ctrl+Alt+F12
   monitor = -1
   ```

`--probe` also prints the monitor's capabilities string; the `60(...)` part lists
every input it admits to having.

## Run it

Double-click `MonitorInputSwitcher.exe`. It sits in the notification area:

- **the hotkey**, or **double-click the icon** — toggle
- right-click for: **Set hotkey...**, switch straight to one input, monitor info,
  edit settings, reload settings, exit

To start it with Windows, press `Win+R`, type `shell:startup`, and drop a
shortcut to the .exe in that folder.

### Choosing the hotkey

Right-click the tray icon and choose **Set hotkey...**. Press the combination you
want — it appears in the box as you press it — then click **Save**. The program
immediately asks Windows for that combination, so you find out there and then
whether something else already owns it, and it writes the choice into
`switcher.ini` so it survives a restart.

Ctrl, Alt, Shift and Win all work as modifiers. A bare key is rejected unless it
is a function key, since `M` on its own would fire every time you typed the
letter. Windows reserves some combinations for itself (most `Win`+letter ones)
and will refuse to hand those over — the dialog tells you if that happens and
keeps your previous hotkey.

You can still set it by hand: edit the `hotkey` line in `switcher.ini`, then
right-click → **Reload settings**.

Other command-line uses, if you'd rather bind it to your own shortcut, Stream
Deck, or a scheduled task:

```
MonitorInputSwitcher.exe --toggle    switch once and exit
MonitorInputSwitcher.exe --a         force inputA once and exit
MonitorInputSwitcher.exe --b         force inputB once and exit
```

## switcher.ini reference

| key | meaning |
| --- | --- |
| `inputA`, `inputB` | the two inputs to toggle. Names (`vga`, `hdmi1`, `dp1`, `dvi1`) or raw values (`0x11`, `17`). |
| `nameA`, `nameB` | labels for the menu and notifications. |
| `hotkey` | `ctrl`/`alt`/`shift`/`win` plus a key: `F1`-`F24`, a letter, a digit, or a name like `PrintScreen`, `Insert`, `Pause`, `NumPad0`. Easier to set from the tray menu. |
| `monitor` | `-1` (default) touches every monitor currently sitting on `inputA` or `inputB` and leaves all others alone. Set it to the index from `--probe` to pin one monitor. |
| `notify` | `true`/`false` for the tray balloon after each switch. |

## Things worth knowing before you rely on it

**The round trip isn't guaranteed.** DDC/CI rides on the cable that this PC is
plugged into. Once you switch the monitor away to the *other* input, the monitor
has to keep answering on the now-idle cable for the hotkey to bring it back. Most
monitors do; some go quiet on an inactive input, and then only the monitor's own
buttons will bring it back. Test that round trip once before you depend on it —
and if VGA is a second computer, build the program there too so each machine can
pull the monitor to itself.

**DDC/CI is sometimes off by default.** If `--probe` says *NO ANSWER*, look in
the monitor's menu (often under *Setup*, *Others*, or *OSD*) for a `DDC/CI`
option and enable it.

**Some links don't carry the channel.** DisplayPort MST hubs, USB/DisplayLink
display adapters, HDMI switches and most KVMs drop the I2C lines, so nothing can
talk to the monitor through them. Plugging straight into the GPU is the fix.
Over VGA it usually works, but VGA DDC is the flakiest of the lot, hence the
retries in the code.

**Windows will shuffle your windows.** When the monitor stops showing this PC,
Windows often treats the display as unplugged and moves windows to whatever
screen remains. That is Windows, not this program — but if the monitor is your
only screen you'll be typing blind until you switch back, so pick a hotkey you
can hit without looking.

**If the toggle does nothing but `--probe` reads fine**, the codes in
`switcher.ini` are wrong for your monitor — redo the two-step probe above.
