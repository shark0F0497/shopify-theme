/**
 * Section Progress Indicator
 * Displays a vertical progress bar on the left side of the page
 * showing scroll progress and current section name
 */

class SectionProgressIndicator {
  constructor() {
    this.progressBar = null;
    this.progressFill = null;
    this.sectionLabel = null;
    this.sectionText = null;
    this.sections = [];
    this.currentSectionIndex = -1;
    this.rafId = null;
    this.isInitialized = false;

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.progressBar = document.getElementById('section-progress-indicator');
    if (!this.progressBar) return;

    this.progressFill = document.getElementById('progress-fill');
    this.sectionLabel = document.getElementById('section-label');
    this.sectionText = this.sectionLabel?.querySelector('.section-progress-indicator__text');

    if (!this.progressFill || !this.sectionText) return;

    // Collect all sections, excluding custom-image-banner
    this.collectSections();

    if (this.sections.length === 0) {
      this.progressBar.style.display = 'none';
      return;
    }

    // Initially hide progress bar - it will show when scrolling to highlight-section
    this.progressBar.style.display = 'none';

    // Initial update with a small delay to ensure DOM is ready
    setTimeout(() => {
      this.update();
    }, 100);

    // Listen to scroll events with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.update();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      this.collectSections();
      this.update();
    }, { passive: true });

    // Handle Shopify theme editor events
    if (Shopify.designMode) {
      document.addEventListener('shopify:section:load', () => {
        this.collectSections();
        this.update();
      });
      document.addEventListener('shopify:section:reorder', () => {
        this.collectSections();
        this.update();
      });
    }

    this.isInitialized = true;
  }

  collectSections() {
    this.sections = [];

    // Find main content area
    const mainContent = document.getElementById('MainContent');
    if (!mainContent) return;

    // Find all shopify-section elements within main content only
    const allSections = mainContent.querySelectorAll('.shopify-section');
    
    allSections.forEach((section) => {
      // Get section type from data attribute or class
      const sectionId = section.id || '';
      const sectionType = this.getSectionType(section);

      // Skip custom-image-banner sections
      if (sectionType === 'custom-image-banner') {
        return;
      }

      // Get section name
      const sectionName = this.getSectionName(section, sectionType);

      if (sectionName) {
        this.sections.push({
          element: section,
          id: sectionId,
          type: sectionType,
          name: sectionName,
          top: 0,
          height: 0
        });
      }
    });

    // Sort sections by their position in the DOM
    this.sections.sort((a, b) => {
      const rectA = a.element.getBoundingClientRect();
      const rectB = b.element.getBoundingClientRect();
      return rectA.top + window.scrollY - (rectB.top + window.scrollY);
    });
  }

  getSectionType(section) {
    // Try to get from data-section-type attribute
    if (section.dataset.sectionType) {
      return section.dataset.sectionType;
    }

    // Try to get from class names (e.g., section-highlight, section-featured-accessories)
    const classList = Array.from(section.classList);
    for (const className of classList) {
      if (className.startsWith('section-') && className !== 'shopify-section') {
        // Remove 'section-' prefix and return the type
        return className.replace('section-', '');
      }
    }

    // Try to find section class in child elements
    const sectionWrapper = section.querySelector('[class*="section-"]');
    if (sectionWrapper) {
      const classList = Array.from(sectionWrapper.classList);
      for (const className of classList) {
        if (className.startsWith('section-')) {
          return className.replace('section-', '');
        }
      }
    }

    // Try to get from ID pattern
    if (section.id) {
      const match = section.id.match(/([a-z-]+)_[a-zA-Z0-9]+$/);
      if (match) {
        return match[1].replace(/_/g, '-');
      }
    }

    return '';
  }

  getSectionName(section, sectionType) {
    // Try to get from data-section-name attribute
    if (section.dataset.sectionName) {
      return section.dataset.sectionName;
    }

    // Try to find specific heading classes first
    const headingSelectors = [
      '.highlight__heading',
      '.featured-accessories__heading',
      '.static-icons__title',
      '.newsletter__heading',
      '.feedback-beta-testers__heading',
      'h1',
      'h2',
      'h3',
      '[class*="heading"]',
      '[class*="title"]'
    ];

    for (const selector of headingSelectors) {
      const heading = section.querySelector(selector);
      if (heading) {
        const text = heading.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          // Convert to uppercase for consistency
          return text.toUpperCase();
        }
      }
    }

    // Fallback: use section type with formatting
    if (sectionType) {
      return this.formatSectionName(sectionType);
    }

    return '';
  }

  formatSectionName(type) {
    // Convert section type to readable name
    // e.g., "highlight-section" -> "HIGHLIGHTS"
    // e.g., "featured-accessories" -> "FEATURED ACCESSORIES"
    
    const nameMap = {
      'highlight-section': 'HIGHLIGHTS',
      'highlight': 'HIGHLIGHTS',
      'featured-accessories': 'FEATURED ACCESSORIES',
      'featured-accessory': 'FEATURED ACCESSORIES',
      'static-icons': 'STATIC SERVICE ICONS',
      'static-icon': 'STATIC SERVICE ICONS',
      'newsletter': 'NEWSLETTER',
      'feedback-beta-testers': 'FEEDBACK BETA TESTERS',
      'feedback-beta-tester': 'FEEDBACK BETA TESTERS'
    };

    if (nameMap[type]) {
      return nameMap[type];
    }

    // Generic formatting
    return type
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .toUpperCase();
  }

  update() {
    if (this.sections.length === 0) return;

    // Calculate scroll progress based on sections (starting from highlight-section)
    // Progress = 0% when first section (highlight-section) top reaches viewport top
    // Progress = 100% when last section bottom reaches viewport top
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    // Get first section (highlight-section) as starting point
    const firstSection = this.sections[0];
    const lastSection = this.sections[this.sections.length - 1];
    
    if (!firstSection || !lastSection) return;
    
    const firstSectionRect = firstSection.element.getBoundingClientRect();
    const lastSectionRect = lastSection.element.getBoundingClientRect();
    
    // getBoundingClientRect() returns position relative to viewport
    // top <= 0 means the element's top is at or above viewport top
    // top > 0 means the element is below viewport top
    const firstSectionTopRelative = firstSectionRect.top;
    const lastSectionBottomRelative = lastSectionRect.bottom;
    
    // Calculate absolute positions for progress calculation
    const firstSectionTop = firstSectionRect.top + scrollTop;
    const lastSectionBottom = lastSectionRect.bottom + scrollTop;
    
    // Show progress bar only when highlight-section top has reached or passed viewport top
    // firstSectionTopRelative <= 0 means highlight-section top is at or above viewport top
    const shouldShow = firstSectionTopRelative <= 0;
    
    if (this.progressBar) {
      if (shouldShow) {
        this.progressBar.style.display = 'flex';
      } else {
        this.progressBar.style.display = 'none';
        return; // Don't update progress if not visible
      }
    }
    
    // Calculate scrollable distance from first section top to last section bottom
    const contentStart = firstSectionTop;
    const contentEnd = lastSectionBottom;
    const contentHeight = contentEnd - contentStart;
    const scrollableDistance = contentHeight - windowHeight;
    
    let scrollProgress = 0;
    const viewportTop = scrollTop;
    
    // Calculate progress: 0% when first section top reaches viewport top
    // 100% when last section bottom reaches viewport top
    if (scrollableDistance > 0) {
      // How much of the content has been scrolled through
      // When viewport top reaches first section top, progress = 0%
      // When viewport top reaches last section bottom, progress = 100%
      const scrolledPastStart = Math.max(0, viewportTop - contentStart);
      scrollProgress = Math.min(100, Math.max(0, (scrolledPastStart / scrollableDistance) * 100));
    } else {
      // If content is shorter than viewport
      if (viewportTop >= contentEnd) {
        scrollProgress = 100;
      } else if (viewportTop < contentStart) {
        scrollProgress = 0;
      } else {
        // Partially visible - calculate based on position
        scrollProgress = ((viewportTop - contentStart) / contentHeight) * 100;
      }
    }

    // Ensure progress is at least 1% if we've scrolled past the start
    if (viewportTop >= contentStart) {
      scrollProgress = Math.max(1, scrollProgress);
    }

    // Update progress bar
    if (this.progressFill) {
      this.progressFill.style.height = `${scrollProgress}%`;
    }

    // Find current section
    const currentSectionIndex = this.findCurrentSection(scrollTop, windowHeight);
    
    if (currentSectionIndex !== this.currentSectionIndex) {
      this.currentSectionIndex = currentSectionIndex;
      this.updateSectionLabel();
    }
  }

  findCurrentSection(scrollTop, windowHeight) {
    if (this.sections.length === 0) return 0;

    const viewportCenter = scrollTop + windowHeight / 2;
    
    // Get first section (highlight-section) as reference point
    const firstSection = this.sections[0];
    const firstSectionRect = firstSection.element.getBoundingClientRect();
    const firstSectionTop = firstSectionRect.top + scrollTop;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const rect = section.element.getBoundingClientRect();
      const sectionTop = rect.top + scrollTop;
      const sectionBottom = sectionTop + rect.height;

      // Update cached positions
      section.top = sectionTop;
      section.height = rect.height;

      // Check if viewport center is within this section
      if (viewportCenter >= sectionTop && viewportCenter <= sectionBottom) {
        return i;
      }
    }

    // If we're before the first section, return first section
    if (scrollTop < firstSectionTop + 100) {
      return 0;
    }

    // If we're at the bottom, return last section
    const lastSection = this.sections[this.sections.length - 1];
    const lastSectionRect = lastSection.element.getBoundingClientRect();
    const lastSectionBottom = lastSectionRect.bottom + scrollTop;
    
    if (scrollTop + windowHeight >= lastSectionBottom - 100) {
      return this.sections.length - 1;
    }

    // Find the closest section
    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const sectionCenter = section.top + section.height / 2;
      const distance = Math.abs(viewportCenter - sectionCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  updateSectionLabel() {
    if (this.currentSectionIndex < 0 || this.currentSectionIndex >= this.sections.length) {
      return;
    }

    const currentSection = this.sections[this.currentSectionIndex];
    if (this.sectionText && currentSection) {
      this.sectionText.textContent = currentSection.name;

      // Keep text at the top of progress bar (aligned with progress bar top)
      this.sectionText.style.paddingTop = '0';
      
      // Set text color based on section type
      // Black for highlight-section, white for others
      if (currentSection.type === 'highlight-section' || currentSection.type === 'highlight') {
        this.sectionText.classList.add('highlight-section');
      } else {
        this.sectionText.classList.remove('highlight-section');
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SectionProgressIndicator();
  });
} else {
  new SectionProgressIndicator();
}

