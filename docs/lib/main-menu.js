const menuItems = [
  { url: '/', name: 'Разведка' },
  { url: '/amitie/new/', name: 'Добавить осколок' },
  { url: '-' },
  { url: '/summary-table/', name: 'Общая таблица' },
  { url: '/top-scouts/', name: 'Топ разведки' },
  { url: '-' },
  { url: '/guide/', name: 'Гайд по разведке' },
  // { url: '/faq/', name: 'Популярные вопросы' },
  { url: 'https://t.me/ornaMemoryHunts/16813', name: 'Чат поддержки' },
  { url: 'https://github.com/orna-memory-hunting/project/issues/new/choose', name: 'Сообщить об ошибке' }
]

export function initMainMenu() {
  const menuButton = document.getElementById('main-menu-button')

  if (!menuButton) return

  const menuList = document.createElement('div')
  const { pathname } = window.location

  document.addEventListener('click', event => {
    /** @type {HTMLDivElement} */// @ts-ignore
    const elm = event.target

    if (!elm.classList.contains('menu-button') && !elm.parentElement.classList.contains('menu-button')) {
      menuList.classList.add('hide')
    }
  })

  menuList.classList.add('main-menu-list')
  menuList.classList.add('hide')
  menuButton.onclick = (event) => {
    menuList.classList.toggle('hide')
    event.stopPropagation()
  }

  for (const { url, name } of menuItems) {
    if (url === '-') {
      const space = document.createElement('div')

      space.classList.add('main-menu-item-space')

      menuList.append(space)
    } else if (url !== pathname) {
      const item = document.createElement('a')

      item.classList.add('main-menu-item')
      item.classList.add('astext')
      item.href = url
      item.textContent = name

      if (url.startsWith('http')) {
        item.target = '_blank'
      }

      menuList.append(item)
    }
    menuButton.parentElement.append(menuList)
  }
}
