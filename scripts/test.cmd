@echo off
setlocal enabledelayedexpansion enableextensions

SET hostname="localhost"
SET blocktime=2
SET root="f:\tmp\projects\ethereum\solidity\altairvr\FirstProject"

cd "%root%"

SET db="%root%\chains\ganache"

IF NOT EXIST %db% (mkdir %db%) ELSE (del /Q /F "%db%\")

".\node_modules\.bin\ganache-cli.cmd" --hostname %hostname% --blocktime %blocktime% --db %db%
