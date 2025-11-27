if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.mql = window.matchMedia('(min-width: 750px)');
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          button: this.querySelector('button.localization-form__select'),
          panel: this.querySelector('.disclosure__list-wrapper'),
          search: this.querySelector('input[name="country_filter"]'),
          closeButton: this.querySelector('.country-selector__close-button'),
          resetButton: this.querySelector('.country-filter__reset-button'),
          searchIcon: this.querySelector('.country-filter__search-icon'),
          liveRegion: this.querySelector('#sr-country-search-results'),
        };

        // Check if nested custom localization structure exists
        this.customLocalization = this.querySelector('.custom-localization');

        if (this.customLocalization) {
          // Initialize nested structure
          this.initCustomLocalization();
        } else {
          // Initialize traditional structure
          this.initTraditionalLocalization();
        }
      }

      initTraditionalLocalization() {
        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        this.addEventListener('keydown', this.onContainerKeyDown.bind(this));
        this.addEventListener('focusout', this.closeSelector.bind(this));
        if (this.elements.button) {
          this.elements.button.addEventListener('click', this.openSelector.bind(this));
        }

        if (this.elements.search) {
          this.elements.search.addEventListener('keyup', this.filterCountries.bind(this));
          this.elements.search.addEventListener('focus', this.onSearchFocus.bind(this));
          this.elements.search.addEventListener('blur', this.onSearchBlur.bind(this));
          this.elements.search.addEventListener('keydown', this.onSearchKeyDown.bind(this));
        }
        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', this.hidePanel.bind(this));
        }
        if (this.elements.resetButton) {
          this.elements.resetButton.addEventListener('click', this.resetFilter.bind(this));
          this.elements.resetButton.addEventListener('mousedown', (event) => event.preventDefault());
        }

        this.querySelectorAll('a').forEach((item) => item.addEventListener('click', this.onItemClick.bind(this)));
      }

      initCustomLocalization() {
        const mainPanel = this.customLocalization.querySelector('.custom-localization__panel');
        const mainButtons = this.customLocalization.querySelectorAll('.custom-localization__main-button');
        const subLinks = this.customLocalization.querySelectorAll('.custom-localization__sub-link');

        // Find the trigger button (the icon button that opens the main panel)
        const triggerButton = this.querySelector('button.localization-form__select');

        if (triggerButton) {
          triggerButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = mainPanel.hasAttribute('hidden');
            mainPanel.toggleAttribute('hidden', !isHidden);
            triggerButton.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

            if (isHidden && this.hasAttribute('data-prevent-hide')) {
              this.header.preventHide = true;
            } else if (!isHidden && this.hasAttribute('data-prevent-hide')) {
              this.header.preventHide = false;
            }
          });
        }

        // Handle main item button clicks (expand/collapse sub-panels)
        mainButtons.forEach((button) => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const subpanelId = button.getAttribute('aria-controls');
            const subpanel = document.getElementById(subpanelId);
            if (subpanel) {
              this.toggleSubPanel(button, subpanel);
            }
          });
        });

        // Handle sub-item link clicks
        subLinks.forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubItemClick(link);
          });
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
          if (
            this.customLocalization &&
            !this.customLocalization.contains(e.target) &&
            !e.target.closest('button.localization-form__select')
          ) {
            mainPanel.setAttribute('hidden', true);
            // Close all sub-panels
            mainButtons.forEach((btn) => {
              btn.setAttribute('aria-expanded', 'false');
              const subpanelId = btn.getAttribute('aria-controls');
              const subpanel = document.getElementById(subpanelId);
              if (subpanel) {
                subpanel.setAttribute('hidden', true);
              }
            });
          }
        });

        // Handle escape key
        this.addEventListener('keyup', (e) => {
          if (e.code === 'Escape') {
            mainPanel.setAttribute('hidden', true);
            mainButtons.forEach((btn) => {
              btn.setAttribute('aria-expanded', 'false');
              const subpanelId = btn.getAttribute('aria-controls');
              const subpanel = document.getElementById(subpanelId);
              if (subpanel) {
                subpanel.setAttribute('hidden', true);
              }
            });
            if (triggerButton) {
              triggerButton.focus();
            }
          }
        });
      }

      toggleMainPanel(panel) {
        const isHidden = panel.hasAttribute('hidden');
        panel.toggleAttribute('hidden', !isHidden);

        if (!isHidden && this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = false;
        } else if (isHidden && this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
      }

      toggleSubPanel(button, subpanel) {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        // Close all other sub-panels
        const allMainButtons = this.customLocalization.querySelectorAll('.custom-localization__main-button');
        allMainButtons.forEach((btn) => {
          if (btn !== button) {
            btn.setAttribute('aria-expanded', 'false');
            const otherSubpanelId = btn.getAttribute('aria-controls');
            const otherSubpanel = document.getElementById(otherSubpanelId);
            if (otherSubpanel) {
              otherSubpanel.setAttribute('hidden', true);
            }
          }
        });

        // Toggle current sub-panel
        button.setAttribute('aria-expanded', (!isExpanded).toString());
        subpanel.toggleAttribute('hidden', isExpanded);
      }

      handleSubItemClick(link) {
        const form = this.querySelector('form');
        const inputName = link.getAttribute('data-input-name');
        const value = link.getAttribute('data-value');
        const input = this.querySelector(`input[name="${inputName}"]`);

        if (input) {
          input.value = value;
        }

        // Update checkmarks
        const subpanel = link.closest('.custom-localization__subpanel');
        if (subpanel) {
          const allLinks = subpanel.querySelectorAll('.custom-localization__sub-link');
          allLinks.forEach((l) => {
            const check = l.querySelector('.custom-localization__check');
            if (check) {
              if (l === link) {
                check.classList.remove('hidden');
                l.setAttribute('aria-current', 'true');
              } else {
                check.classList.add('hidden');
                l.removeAttribute('aria-current');
              }
            }
          });
        }

        // Update display value
        const mainItem = link.closest('.custom-localization__main-item');
        if (mainItem) {
          const display = mainItem.querySelector('.custom-localization__display');
          const subLabel = link.querySelector('.custom-localization__sub-label');
          if (display && subLabel) {
            // For currency, use currency code if available, otherwise use sub-label
            const currencyCode = link.getAttribute('data-currency-code');
            if (currencyCode) {
              display.textContent = currencyCode;
            } else {
              display.textContent = subLabel.textContent.trim();
            }
          }
        }

        // If currency was selected, also update country display if it changed
        const currencyCode = link.getAttribute('data-currency-code');
        if (currencyCode && inputName === 'country_code') {
          const countryItem = this.customLocalization.querySelector('[data-type="country"]');
          if (countryItem) {
            const countryDisplay = countryItem.querySelector('.custom-localization__display');
            const selectedCountryLink = Array.from(
              this.customLocalization.querySelectorAll('[data-input-name="country_code"]')
            ).find((l) => l.getAttribute('data-value') === value);
            if (countryDisplay && selectedCountryLink) {
              const countrySubLabel = selectedCountryLink.querySelector('.custom-localization__sub-label');
              if (countrySubLabel) {
                countryDisplay.textContent = countrySubLabel.textContent.trim();
              }
            }
          }
        }

        // Close sub-panel after selection
        if (subpanel) {
          subpanel.setAttribute('hidden', true);
          const button = this.customLocalization.querySelector(`[aria-controls="${subpanel.id}"]`);
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }

        // Submit form
        if (form) {
          form.submit();
        }
      }

      hidePanel() {
        this.elements.button.setAttribute('aria-expanded', 'false');
        this.elements.panel.setAttribute('hidden', true);
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.setAttribute('aria-activedescendant', '');
        }
        document.body.classList.remove('overflow-hidden-mobile');
        document.querySelector('.menu-drawer').classList.remove('country-selector-open');
        this.header.preventHide = false;
      }

      onContainerKeyDown(event) {
        const focusableItems = Array.from(this.querySelectorAll('a')).filter(
          (item) => !item.parentElement.classList.contains('hidden')
        );
        let focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
        let itemToFocus;

        switch (event.code.toUpperCase()) {
          case 'ARROWUP':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
            itemToFocus.focus();
            break;
          case 'ARROWDOWN':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
            itemToFocus.focus();
            break;
        }

        if (!this.elements.search) return;

        setTimeout(() => {
          focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
          if (focusedItemIndex > -1) {
            this.elements.search.setAttribute('aria-activedescendant', focusableItems[focusedItemIndex].id);
          } else {
            this.elements.search.setAttribute('aria-activedescendant', '');
          }
        });
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      onItemClick(event) {
        event.preventDefault();
        const form = this.querySelector('form');
        this.elements.input.value = event.currentTarget.dataset.value;
        if (form) form.submit();
      }

      openSelector() {
        this.elements.button.focus();
        this.elements.panel.toggleAttribute('hidden');
        this.elements.button.setAttribute(
          'aria-expanded',
          (this.elements.button.getAttribute('aria-expanded') === 'false').toString()
        );
        if (!document.body.classList.contains('overflow-hidden-tablet')) {
          document.body.classList.add('overflow-hidden-mobile');
        }
        if (this.elements.search && this.mql.matches) {
          this.elements.search.focus();
        }
        if (this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
        document.querySelector('.menu-drawer').classList.add('country-selector-open');
      }

      closeSelector(event) {
        if (
          event.target.classList.contains('country-selector__overlay') ||
          !this.contains(event.target) ||
          !this.contains(event.relatedTarget)
        ) {
          this.hidePanel();
        }
      }

      normalizeString(str) {
        return str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
      }

      filterCountries() {
        const searchValue = this.normalizeString(this.elements.search.value);
        const popularCountries = this.querySelector('.popular-countries');
        const allCountries = this.querySelectorAll('a');
        let visibleCountries = allCountries.length;

        this.elements.resetButton.classList.toggle('hidden', !searchValue);

        if (popularCountries) {
          popularCountries.classList.toggle('hidden', searchValue);
        }

        allCountries.forEach((item) => {
          const countryName = this.normalizeString(item.querySelector('.country').textContent);
          if (countryName.indexOf(searchValue) > -1) {
            item.parentElement.classList.remove('hidden');
            visibleCountries++;
          } else {
            item.parentElement.classList.add('hidden');
            visibleCountries--;
          }
        });

        if (this.elements.liveRegion) {
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.countrySelectorSearchCount.replace(
            '[count]',
            visibleCountries
          );
        }

        this.querySelector('.country-selector').scrollTop = 0;
        this.querySelector('.country-selector__list').scrollTop = 0;
      }

      resetFilter(event) {
        event.stopPropagation();
        this.elements.search.value = '';
        this.filterCountries();
        this.elements.search.focus();
      }

      onSearchFocus() {
        this.elements.searchIcon.classList.add('country-filter__search-icon--hidden');
      }

      onSearchBlur() {
        if (!this.elements.search.value) {
          this.elements.searchIcon.classList.remove('country-filter__search-icon--hidden');
        }
      }

      onSearchKeyDown(event) {
        if (event.code.toUpperCase() === 'ENTER') {
          event.preventDefault();
        }
      }
    }
  );
}
