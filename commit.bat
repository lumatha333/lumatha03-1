@echo off
echo Adding FunPun game console...
git add public/funpun.html
git commit -m "feat: Add FunPun FP-333 retro gaming console

- Nokia 3310-inspired design with authentic LCD aesthetics
- 29 games including Snake, Tetris, Pac-Man, 3D racing, and more
- Full keyboard + touch + gamepad controls
- Progressive difficulty and high score persistence
- Standalone HTML file for easy deployment"
echo.
echo Commit complete!
git push origin HEAD
echo.
echo Push complete!
pause
