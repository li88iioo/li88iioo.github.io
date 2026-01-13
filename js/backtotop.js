// back to top js
function isHidden() {
  let scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 300) {
    document.querySelector(".back-to-top").classList.remove("hidden");
    // Ensure tools-bar-item class is present just in case, though usually we just toggle hidden
    if (!document.querySelector(".back-to-top").classList.contains("tools-bar-item")) {
      document.querySelector(".back-to-top").classList.add("tools-bar-item");
    }
  } else {
    document.querySelector(".back-to-top").classList.add("hidden");
  }
}

const backToTop = () => {
  let scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop,
    delay = 10,
    time = 200;
  let step = Math.ceil(scrollTop * delay / time);
  let timer = setInterval(() => {
    scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop - step <= 0) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      clearInterval(timer);
    } else {
      document.documentElement.scrollTop = scrollTop - step;
      document.body.scrollTop = scrollTop - step;
    }
  }, delay);
}

isHidden()
document.addEventListener("scroll", isHidden, false);
document.querySelector(".back-to-top").addEventListener("click", backToTop, false);
