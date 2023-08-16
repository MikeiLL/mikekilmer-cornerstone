import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import {createTranslationDictionary} from '../theme/common/utils/translations-utils';
import {showAlertModal} from './global/modal';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();
        this.cartCount();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

      this.ariaNotifyNoProducts();

      // Mike Kilmer adds following as per Andrew email

      if (this.context.template === 'pages/custom/category/special-items') {
        this.addAllButton();
        this.removeAllButton();
        // Attach message container next to filter select.
        $('form.actionBar').after('<div style="background-color: yellow; padding: 0.8em; display: none; margin: 1em auto; max-width: fit-content" id="itemsAdded"></div>');
      }
    }

    /**
     * Add All to Cart Button
     * @return {void}
     * @todo  Refactor following two functions into one
     */
    addAllButton() {
      const addButton = $('<button class="button button--secondary" type="button">Add All to Cart</button>');
      addButton.on('click', (e) => {
        e.preventDefault();
        this.addAllToCart();
      });
      $('form.actionBar').append(addButton);
    }

    removeAllButton() {
      const removeButton = $('<button id="removeAll" class="button button--secondary" type="button">Remove All from Cart</button>');
      removeButton.on('click', (e) => {
        e.preventDefault();
        this.clearCart();
      });
      removeButton.hide();
      $('form.actionBar').append(removeButton);
    }

    async clearCart() {
      try {
        const cartId = await this.fetchCartId();
        if (!cartId) {
          // no cart to clear
          return;
        }
        const response = await fetch('/api/storefront/carts/' + cartId, {
          method: 'DELETE',
          credentials: 'include'
        });
        showAlertModal("Removed all items from cart", {
          icon: 'info' // error, warning, info, success
        });
        $('#itemsAdded').hide();
        $('#removeAll').hide();
      } catch (error) {
        console.error(error);
        showAlertModal("Ooh. Something went wrong: " + error, {
          icon: 'error' // error, warning, info, success
        });
      }
    }


    cartCount() {
      fetch('/api/storefront/carts', {
        credentials: 'include'
      }).then((response) => {
        return response.json();
      }).then((cartJson) => {
        if (cartJson.length >= 1) {
          this.removeAllButton();
        }
      }).catch(function (error) {
        console.error(error);
      });
    }

    /**
     * Fetch Cart Id
     * @returns {Promise} cartId || false
     */
    fetchCartId() {
      return fetch('/api/storefront/carts', {
        credentials: 'include'
      }).then( (response) => {
        return response.json();
      }).then((cartJson) => {
        if (cartJson.length < 1 || !cartJson[0].id) {
          return false;
        }
        return cartJson[0].id;
      }).catch(function (error) {
        console.error(error);
      });
    }

    buildLineItems() {
      const lineitems = [];
          // for now just query the DOM for all the product IDs in this page.
          // Not reliable for paginated result set.
          $('[data-entity-id]').each((i, el) => {
            const productId = $(el).data('entity-id');
            if (productId) {
              lineitems.push({
                "quantity": 1,
                "product_id": productId
              });
            }
          });
      return lineitems;
    }

    notifyAddedToCart() {
      $('#itemsAdded').html(' ✅ Added all specialty items to cart').show();
    }

    // @todo a bit of WET following two functions
    async addToCart(cartId, lineitems) {
        const endpoint = cartId ? '/api/storefront/carts/' + cartId + '/items' : '/api/storefront/carts';
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            "line_items": lineitems
          })
        });
        return await response.json();
      }

    async addAllToCart() {
      try {
        const lineitems = this.buildLineItems();
        const cartId = await this.fetchCartId();
        await this.addToCart(cartId, lineitems);
        this.notifyAddedToCart();
        $('#removeAll').show();
      } catch (error) {
        console.error(error);
        showAlertModal("Ooh. Something went wrong: " + error, {
          icon: 'error' // error, warning, info, success
        });
      }
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
