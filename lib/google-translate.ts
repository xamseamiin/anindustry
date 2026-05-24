// Google Translate Integration Utility
// This file handles Google Translate widget integration

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: any;
        translate: {
          (elementId: string, options: any): void;
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

let googleTranslateInitialized = false;

// Initialize Google Translate Widget
export const initializeGoogleTranslate = () => {
  // Ensure element exists first
  let translateElement = document.getElementById('google_translate_element');
  if (!translateElement) {
    translateElement = document.createElement('div');
    translateElement.id = 'google_translate_element';
    translateElement.style.cssText = 'position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
    document.body.appendChild(translateElement);
  }

  // Check if Google Translate script is already loaded
  if (googleTranslateInitialized || window.google?.translate) {
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="translate.google.com"]');
  if (existingScript) {
    googleTranslateInitialized = true;
    return;
  }

  // Create and append Google Translate script
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  
  // Define the callback function
  window.googleTranslateElementInit = () => {
    googleTranslateInitialized = true;
    const element = document.getElementById('google_translate_element');
    if (element && window.google?.translate) {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,so',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        console.log('Google Translate initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Translate:', error);
      }
    } else {
      console.warn('Google Translate element or API not found');
    }
  };

  script.onerror = () => {
    console.error('Failed to load Google Translate script');
  };

  document.head.appendChild(script);
};

// Change language using Google Translate
export const changeGoogleTranslateLanguage = (language: 'so' | 'en') => {
  console.log('Changing Google Translate language to:', language);
  
  // If switching to English, remove translation
  if (language === 'en') {
    removeGoogleTranslate();
    return;
  }

  // Wait for Google Translate to be ready
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds max wait
  
  const checkAndTranslate = () => {
    attempts++;
    
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      console.log('Found Google Translate select element', select);
      console.log('Options:', Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text })));
      
      // Try to find and select the Somali option
      const options = select.options;
      let found = false;
      
      for (let i = 0; i < options.length; i++) {
        const optionValue = options[i].value;
        const optionText = options[i].text.toLowerCase();
        
        // Check for Somali language code - Google Translate uses various formats
        if (language === 'so' && (
          optionValue === 'so' || 
          optionValue === '|so' ||
          optionValue.includes('so') || 
          optionText.includes('somali') ||
          optionText.includes('soomaali')
        )) {
          console.log('Found Somali option:', optionValue, optionText);
          select.value = optionValue;
          select.selectedIndex = i;
          
          // Trigger multiple events to ensure it works
          select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          select.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Also try direct property change
          (select as any).fireEvent?.('onchange');
          
          found = true;
          
          // Double check after a delay
          setTimeout(() => {
            if (select.value !== optionValue) {
              select.value = optionValue;
              select.selectedIndex = i;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            console.log('Final select value:', select.value);
          }, 200);
          
          return;
        }
      }
      
      // If exact match not found, try to set by index (usually Somali is index 1 or 2)
      if (!found && language === 'so' && options.length > 1) {
        console.log('Trying to find Somali by index...');
        // Try common positions for Somali
        for (let idx of [1, 2, 3, 4]) {
          if (options[idx]) {
            const optValue = options[idx].value;
            const optText = options[idx].text.toLowerCase();
            if (optValue.includes('so') || optText.includes('somali') || optText.includes('soomaali')) {
              console.log('Found Somali at index:', idx, optValue, optText);
              select.selectedIndex = idx;
              select.value = optValue;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return;
            }
          }
        }
      }
      
      if (!found) {
        console.warn('Somali language option not found in Google Translate dropdown');
      }
    } else if (attempts < maxAttempts) {
      // Retry after a short delay
      setTimeout(checkAndTranslate, 100);
    } else {
      console.error('Google Translate select element not found after', maxAttempts, 'attempts');
      // Try to reinitialize
      if (attempts === maxAttempts) {
        console.log('Attempting to reinitialize Google Translate...');
        googleTranslateInitialized = false;
        initializeGoogleTranslate();
        setTimeout(() => {
          changeGoogleTranslateLanguage(language);
        }, 1000);
      }
    }
  };

  // Start checking after a short delay to ensure Google Translate is loaded
  setTimeout(checkAndTranslate, 300);
};

// Remove Google Translate (when switching back to original language)
export const removeGoogleTranslate = () => {
  // Find and reset the Google Translate select
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (select) {
    // Set to original language (English)
    const originalOption = Array.from(select.options).find(opt => 
      opt.value === 'en' || opt.value === '' || opt.text.toLowerCase().includes('english') || opt.text.toLowerCase().includes('original')
    );
    if (originalOption) {
      select.value = originalOption.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (select.options.length > 0) {
      // Fallback: select first option (usually original)
      select.selectedIndex = 0;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  // Hide Google Translate banner if present
  const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement;
  if (banner) {
    banner.style.display = 'none';
  }
  
  // Hide Google Translate footer if present
  const footer = document.querySelector('.goog-te-footer') as HTMLElement;
  if (footer) {
    footer.style.display = 'none';
  }
  
  // Reset page language attribute
  const html = document.documentElement;
  html.setAttribute('lang', 'en');
};

