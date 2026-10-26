document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('.site-header');
  const logoImg = document.querySelector('.logo-img');
  const mainVisualBox = document.querySelector('.main-visual-box');

  if (header && logoImg && mainVisualBox) {
    const changeHeaderBgAndRotateLogo = (color) => {
      header.style.backgroundColor = color;
      logoImg.style.transform = 'rotate(360deg)';
      logoImg.style.transition = 'all 2s ease-in-out';
    };

    mainVisualBox.addEventListener('click', function() {
      changeHeaderBgAndRotateLogo('orange');
    });
  }
});