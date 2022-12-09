export function addSnow() {
  const style = document.createElement('style')
  const container = document.createElement('div')
  const brW = document.body.clientWidth
  const snowflakeCnt = document.body.clientHeight * brW * 0.00045 ^ 0
  const snowflakeStrt = snowflakeCnt * 0.1 ^ 0 || 1
  const snowflakeTimer = 1000
  const steps = document.body.clientHeight / (brW * 1.5) ^ 0
  const step = 100 / steps
  let hideCount = Math.random() * snowflakeCnt / 2 ^ 0

  style.innerHTML = `
    .container-snowflake {
      position: fixed;
    }
    .snowflake {
      position: absolute;
      width: 7px;
      height: 7px;
      background: white;
      border-radius: 50%;
      box-shadow: 0px 0px 4px white;
    }
    .snowflake--hide {
      display: none;
    }
  `

  for (let snowID = 1; snowID <= snowflakeCnt; snowID++) {
    const timeS = (document.body.clientHeight * 0.05 + Math.random() * document.body.clientHeight * 0.04) ^ 0
    const timeE = (document.body.clientHeight * 0.04 + Math.random() * document.body.clientHeight * 0.05) ^ 0

    style.innerHTML += `
    .snowflake:nth-child(${snowID}) {
      animation: snowflake-${snowID} ${timeS}s -${timeE}s linear infinite;
    }
    @keyframes snowflake-${snowID}  {
      from {
        opacity: ${0.1 + Math.random() * 0.4};
        transform: translate(${Math.random() * brW ^ 0}px, -8px) scale(${0.25 + Math.random() * 0.75});
      }
    `
    for (let idx = 0; idx < steps; idx++) {
      const percent = step * idx + step / 3 + Math.random() * step / 3

      style.innerHTML += `
      ${percent}% {
        opacity: ${0.1 + Math.random() * 0.4};
        transform: translate(${Math.random() * brW ^ 0}px, ${percent}vh) scale(${0.25 + Math.random() * 0.75});
      }
    `
    }
    style.innerHTML += `
      to {
        opacity: ${0.1 + Math.random() * 0.4};
        transform: translate(${Math.random() * brW ^ 0}px, 100vh) scale(${0.25 + Math.random() * 0.75});
      }
    }
  `
  }

  document.head.append(style)

  container.classList.add('container-snowflake')
  document.body.prepend(container)

  setInterval(() => {
    const snowflakes = container.querySelectorAll('.snowflake')

    if (snowflakes.length < snowflakeCnt) {
      const snowflake = document.createElement('div')

      snowflake.classList.add('snowflake')

      if (snowflakes.length === 0) {
        for (let i = 0; i < snowflakeStrt; i++) {
          container.append(snowflake.cloneNode(true))
        }
      } else {
        container.append(snowflake)
      }
    } else {
      if (hideCount) {
        snowflakes[Math.random() * (snowflakeCnt - 1) ^ 0].classList.add('snowflake--hide')
        hideCount--
      } else {
        const hSnowflakes = container.querySelectorAll('.snowflake--hide')

        if (hSnowflakes.length) {
          hSnowflakes[Math.random() * (hSnowflakes.length - 1) ^ 0].classList.remove('snowflake--hide')
        } else {
          hideCount = Math.random() * snowflakeCnt / 2 ^ 0
        }
      }
    }
  }, snowflakeTimer)
}
