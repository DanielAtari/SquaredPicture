/**
 * SPA Router - תמונה בריבוע
 * מאפשר ניווט חלק בין דפים ללא רענון מלא
 */

(function() {
  'use strict';

  // Cache לדפים שכבר נטענו
  const pageCache = new Map();
  
  // דפים שלא צריכים SPA routing (כי יש להם לוגיקה מיוחדת)
  const excludedPages = ['checkout.html', 'confirm.html', 'order.html', 'processing.html', 'gallery.html'];
  
  // Loading indicator element
  let loadingIndicator = null;

  /**
   * אתחול ה-Router
   */
  function init() {
    // יצירת Loading Indicator
    createLoadingIndicator();
    
    // תפיסת קליקים על קישורים
    document.addEventListener('click', handleLinkClick);
    
    // טיפול בכפתורי Back/Forward
    window.addEventListener('popstate', handlePopState);
    
    // Preload על hover
    document.addEventListener('mouseover', handleHover);
    
    // שמירת הדף הנוכחי ב-cache
    cacheCurrentPage();
  }

  /**
   * יצירת Loading Indicator
   */
  function createLoadingIndicator() {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'page-loader';
    loadingIndicator.innerHTML = '<div class="loader-spinner"></div>';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #2f090d, #5a1a22, #2f090d);
      background-size: 200% 100%;
      animation: loading-bar 1s ease-in-out infinite;
      z-index: 9999;
      display: none;
    `;
    
    // הוספת style לאנימציה
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loading-bar {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loadingIndicator);
  }

  /**
   * הצגת/הסתרת Loading
   */
  function showLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
  }

  function hideLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  /**
   * בדיקה האם קישור הוא פנימי
   */
  function isInternalLink(href) {
    if (!href) return false;
    
    // קישורים חיצוניים
    if (href.startsWith('http') && !href.includes(window.location.host)) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('https://wa.me')) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('javascript:')) return false;
    
    // קבצים שאינם HTML
    const extension = href.split('.').pop().split('?')[0];
    if (!['html', 'htm', ''].includes(extension)) return false;
    
    return true;
  }

  /**
   * בדיקה האם דף מוחרג מ-SPA
   */
  function isExcludedPage(href) {
    return excludedPages.some(page => href.includes(page));
  }

  /**
   * טיפול בקליק על קישור
   */
  function handleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // בדיקות שונות
    if (!isInternalLink(href)) return;
    if (isExcludedPage(href)) return;
    if (link.target === '_blank') return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    
    // מניעת התנהגות ברירת מחדל
    e.preventDefault();
    
    // ניווט לדף
    navigateTo(href);
  }

  /**
   * טיפול ב-Hover לצורך Preload
   */
  function handleHover(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    if (!isInternalLink(href)) return;
    if (isExcludedPage(href)) return;
    if (pageCache.has(href)) return;
    
    // Preload הדף ברקע
    preloadPage(href);
  }

  /**
   * Preload דף ברקע
   */
  function preloadPage(href) {
    fetch(href)
      .then(response => response.text())
      .then(html => {
        pageCache.set(href, html);
      })
      .catch(() => {
        // שקט - לא קריטי
      });
  }

  /**
   * שמירת הדף הנוכחי ב-cache
   */
  function cacheCurrentPage() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const mainContent = document.getElementById('page-content');
    
    if (mainContent) {
      pageCache.set(currentPath, document.documentElement.outerHTML);
    }
  }

  /**
   * ניווט לדף
   */
  async function navigateTo(href) {
    showLoading();
    
    try {
      let html;
      
      // בדיקה ב-cache
      if (pageCache.has(href)) {
        html = pageCache.get(href);
      } else {
        const response = await fetch(href);
        if (!response.ok) throw new Error('Page not found');
        html = await response.text();
        pageCache.set(href, html);
      }
      
      // חילוץ התוכן
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newContent = doc.getElementById('page-content');
      const newTitle = doc.querySelector('title');
      
      if (newContent) {
        // החלפת תוכן
        const currentContent = document.getElementById('page-content');
        if (currentContent) {
          // אנימציית מעבר
          currentContent.style.opacity = '0';
          currentContent.style.transition = 'opacity 0.15s ease-out';
          
          setTimeout(() => {
            currentContent.innerHTML = newContent.innerHTML;
            currentContent.style.opacity = '1';
            
            // עדכון כותרת
            if (newTitle) {
              document.title = newTitle.textContent;
            }
            
            // עדכון URL
            history.pushState({ href: href }, '', href);
            
            // גלילה לראש הדף
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // הפעלת סקריפטים חדשים אם יש
            executePageScripts(newContent);
            
            hideLoading();
          }, 150);
        }
      } else {
        // אם אין page-content, עבור לדף רגיל
        window.location.href = href;
      }
      
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback לניווט רגיל
      window.location.href = href;
    }
  }

  /**
   * הפעלת סקריפטים של הדף החדש
   */
  function executePageScripts(content) {
    const scripts = content.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        // סקריפט חיצוני - לא נטען מחדש
        return;
      }
      
      // סקריפט inline - הרצה
      try {
        eval(script.textContent);
      } catch (e) {
        console.warn('Script execution error:', e);
      }
    });
    
    // אתחול גלריה אם קיימת
    if (document.querySelector('.gallery-grid') && typeof window.initGallery === 'function') {
      window.initGallery();
    }
  }

  /**
   * טיפול בכפתורי Back/Forward
   */
  function handlePopState(e) {
    const href = window.location.pathname.split('/').pop() || 'index.html';
    navigateTo(href);
  }

  // אתחול כשהדף נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

