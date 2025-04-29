
let balance = 100;
let coefficient = 1.00;
let coefElem = document.getElementById("coefficient");
let rocket = document.getElementById("rocket");

function startGame() {
  let multiplier = 1.00;
  let interval = setInterval(() => {
    multiplier += 0.02;
    coefficient = multiplier;
    coefElem.innerText = 'x' + multiplier.toFixed(2);
    let pos = parseInt(rocket.style.bottom || 20);
    rocket.style.bottom = (pos + 2) + "px";
    if (multiplier > 10) {
      clearInterval(interval);
      coefElem.innerText = '💥 CRASH!';
    }
  }, 100);
}

window.onload = startGame;
