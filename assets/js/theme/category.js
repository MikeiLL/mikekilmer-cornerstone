import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import utils from '@bigcommerce/stencil-utils';
import {createTranslationDictionary} from '../theme/common/utils/translations-utils';
import { showAlertModal } from './global/modal';

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
      showAlertModal("we have a modal", {
        icon: 'success' // error, warning, info, success
      });

      if (this.context.template === 'pages/custom/category/special-items') {
        $('form.actionBar').append('<button class="button button--secondary" type="button">Add All to Cart</button>').on('click', 'button', (e) => {
          e.preventDefault();
          this.addAllToCart();
        });
        $('form.actionBar').after('<span style="background-color: yellow" id="items-added"></span>');
      }
    }

    clearCart() {
      console.log('Clear Cart');
      fetch('/api/storefront/carts/' + cartId + '/items', {
          method: 'DELETE',
          credentials: 'include'
      }).then(function (response) {
        return response.json();
      }).then(function (cartJson) {
        $('#items-added').html(' ✅ Removed all items from cart');
      }).catch(function (error) {
        console.log(error);
      });
    }

    async cartCount() {
    console.log('Cart Count');
      fetch('/api/storefront/carts', {
        credentials: 'include'
      }).then((response) => {
        return response.json();
      }).then((cartJson) => {
        console.log(this);
        if (cartJson.length >= 1) {
          $('form.actionBar').append('<button class="button button--secondary" type="button">Remove All Items</button>').on('click', 'button', (e) => {
            e.preventDefault();
            this.clearCart();
            console.log('Clear Cart');
          })
        }
      }).catch(function (error) {
        console.log(error);
      });
    }

    fetchCartDetails() {
      console.log('Log Cart');
          fetch('/api/storefront/carts', {
            credentials: 'include'
          }).then((response) => {
            return response.json();
          }).then((myJson) => {
            console.log(myJson);
          }).catch( (error) => {
            console.log(error);
          });
    }

    addAllToCart() {
      console.log('Add All to Cart');
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
      console.log('Add to Cart');
      fetch('/api/storefront/carts', {
        credentials: 'include'
      }).then( (response) => {
        return response.json();
      }).then( (cartJson) => {
        console.log("this: " + this);
        return cartJson[0].id;
      }).catch(function (error) {
        console.log(error);
      }).then( (cartId) => {
        return fetch('/api/storefront/carts/' + cartId + '/items', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            "line_items": lineitems
          })
        });
        }).then( (response) => {
          return response.json();
        }).then( (cartJson) => {
          this.fetchCartDetails();
          $('#items-added').html(' ✅ Added all items to cart');
        }).catch(function (error) {
          console.log(error);
        });

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
