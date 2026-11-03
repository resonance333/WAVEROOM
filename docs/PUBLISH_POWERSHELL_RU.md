# GitHub Pages на Windows (VS Code / PowerShell)

1. Распакуй весь архив с папкой `WAVEROOM_site` (НЕ открывай index.html из ZIP).
2. Создай пустой **Public** репозиторий `WAVEROOM` на https://github.com/new. **Не** создавай дополнительные README/.gitignore/License при создании: проект уже содержит Git-историю.
3. Открой в VS Code именно папку `WAVEROOM_site` и Terminal -> New Terminal.
4. В терминале запусти `git status`, затем `git log --oneline` — должны отображаться предыдущие коммиты.
5. Введи (замени `YOUR_USERNAME` на свой GitHub логин):

```powershell
git branch -M main
git remote -v
git remote add origin https://github.com/YOUR_USERNAME/WAVEROOM.git
git push -u origin main
```

Если команда `git remote add origin` скажет, что `origin` уже существует, **вместо неё** выполни:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/WAVEROOM.git
git push -u origin main
```

6. На GitHub → репозиторий `WAVEROOM` → Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
7. Открой `https://YOUR_USERNAME.github.io/WAVEROOM/`. Проверь CSS, WebP, SVG, меню, темы, форму, звук и мобильную версию.
8. На защите покажи ссылку и `git log --oneline`.

Ничего в этом архиве автоматически не отправляется в GitHub: команды требуют твой аккаунт и авторизацию.
