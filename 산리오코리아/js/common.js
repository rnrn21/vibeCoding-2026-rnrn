document.addEventListener('DOMContentLoaded', function() {
  // 1. TOP 버튼 스크롤 제어
  const btnTop = document.getElementById('btnTop');
  if (btnTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        btnTop.classList.add('show');
      } else {
        btnTop.classList.remove('show');
      }
    });
  }

  // 2. 모바일 햄버거 메뉴 토글 제어
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const headerNav = document.getElementById('headerNav');

  if (menuToggleBtn && headerNav) {
    menuToggleBtn.addEventListener('click', function() {
      headerNav.classList.toggle('active');
      menuToggleBtn.classList.toggle('active');
    });

    // 메뉴 링크 클릭 시 자동 닫기
    const navLinks = document.querySelectorAll('.header-nav .nav-list a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        headerNav.classList.remove('active');
        menuToggleBtn.classList.remove('active');
      });
    });
  }
});