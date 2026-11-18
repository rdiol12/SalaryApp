@echo off
setlocal

rem Builds MonitorInputSwitcher.exe with the C# compiler that is already part of
rem Windows (.NET Framework 4.x). No Visual Studio or .NET SDK needed.

set CSC=
for %%D in (Framework64 Framework) do (
  for %%V in (v4.0.30319 v3.5) do (
    if exist "%WINDIR%\Microsoft.NET\%%D\%%V\csc.exe" (
      if not defined CSC set CSC=%WINDIR%\Microsoft.NET\%%D\%%V\csc.exe
    )
  )
)

if not defined CSC (
  echo Could not find csc.exe under %WINDIR%\Microsoft.NET.
  echo Install the .NET Framework 4.x feature, or build with any C# compiler using:
  echo   csc /target:winexe /out:MonitorInputSwitcher.exe MonitorInputSwitcher.cs
  exit /b 1
)

echo Using %CSC%
"%CSC%" /nologo /target:winexe /optimize+ /out:"%~dp0MonitorInputSwitcher.exe" ^
  /reference:System.dll ^
  /reference:System.Drawing.dll ^
  /reference:System.Windows.Forms.dll ^
  "%~dp0MonitorInputSwitcher.cs"

if errorlevel 1 (
  echo.
  echo Build failed.
  exit /b 1
)

echo.
echo Built "%~dp0MonitorInputSwitcher.exe"
echo.
echo Next: run  MonitorInputSwitcher.exe --probe   on each input to read its real code.
endlocal
