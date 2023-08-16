# Cornerstone Kilmer
![tests](https://github.com/bigcommerce/cornerstone/workflows/Theme%20Bundling%20Test/badge.svg?branch=master)


## Mike Kilmer Notes on the Project

I had [this Big Commerce sandbox store](https://sandbox-test-for-big-bald-guy.mybigcommerce.com) sitting around so installed the theme there, with the Special Item in it's category.

The Stencil CLI is sweet. Read some docs: [Big Commerce Dev](https://developer.bigcommerce.com), [webdav](https://support.bigcommerce.com/s/article/File-Access-WebDAV?language=en_US), [Stencil](https://stenciljs.com/docs/cli), [Moustachejs](https://github.com/janl/mustache.js), [Handlebar Helpers](https://developer.bigcommerce.com/stencil-docs/reference-docs/handlebars-helpers-reference) [API Guides](https://developer.bigcommerce.com/api-docs/getting-started/about-our-api) [BC Rest](https://developer.bigcommerce.com/docs/rest-storefront) [Headless API access](https://developer.bigcommerce.com/api-docs/storefront/graphql/graphql-api-overview).

### Brief Overview of Test

* Wish I had read this README sooner! Whoops.

#### The Image Swap
* Files modified: `components/common/responsive-img.html`, `components/products/card/html`
* Initially, within from `product-listing.html`, injected the category.products into `jsContext`.
* Decided on more moustach-centric: adding the alternate image to the image dataset within Moustach template.
* Noticed that `products/card` component also has `images` in it's scope, so pass those into `responsive-image`
* Spent some time getting a workable `{{#if }}` in case there's only a single image.
* * Was hoping for something like `altImage=images.1.data || false`, but no luck.
* * `Parse error on line 73: ...Image=images.1.data` without telling me which file the error occured in. Arrg.
* Every templating system has it's quirks.
* Added `onmouseover` and `onmouseout` to swap out the `srcset`, which won't have old browser support
* Using a second image element and animating the swap would be more elegant.

#### Add all to cart
* Files modified: `assets/js/theme/category.js`
* Well, first I worked up a version using multiple calls to `utils.api.cart.itemAdd`
* * (and was annoyed there wasn't a method to add multiple items to the cart)
* Then looked back at the specification to utilize the Storefront API.
* * This confused me at first as I'm used to seeing those requests from a server.
* * Am curious how Stencil achieves the requests and imagine it proxies through the back end.
* I expect there's an easy way to get all products from a specific category, but for now just grabbing from DOM.
* Then loop through and build up an object to use to update the cart.
* If there isn't a cart, create one; if there is, add to it.

#### Remove All from cart
* Files modified: `assets/js/theme/category.js`
* The spec just said to empty the cart if there's at least one thing in it, so, simple.

#### User Feedback on both of the above
* Shortcut for rest of site with `this.context.template === 'pages/custom/category/special-items'`
* * Expect might be more elegant to subclass `Category` class and load it into one of my custom template pages.


#### Logged In User Details Banner
* Files modified: `templates/components/common/navigation.html`


* * nice aria features


### Resources

https://developer.bigcommerce.com/stencil-docs/overview
https://developer.bigcommerce.com/stencil-docs/reference-docs/handlebars-helpers-reference#jscontext

### Stencil Utils
[Stencil-utils](https://github.com/bigcommerce/stencil-utils) is our supporting library for our events and remote interactions.

## JS API
When writing theme JavaScript (JS) there is an API in place for running JS on a per page basis. To properly write JS for your theme, the following page types are available to you:

* "pages/account/addresses"
* "pages/account/add-address"
* "pages/account/add-return"
* "pages/account/add-wishlist"
* "pages/account/recent-items"
* "pages/account/download-item"
* "pages/account/edit"
* "pages/account/return-saved"
* "pages/account/returns"
* "pages/account/payment-methods"
* "pages/auth/login"
* "pages/auth/account-created"
* "pages/auth/create-account"
* "pages/auth/new-password"
* "pages/blog"
* "pages/blog-post"
* "pages/brand"
* "pages/brands"
* "pages/cart"
* "pages/category"
* "pages/compare"
* "pages/errors"
* "pages/gift-certificate/purchase"
* "pages/gift-certificate/balance"
* "pages/gift-certificate/redeem"
* "global"
* "pages/home"
* "pages/order-complete"
* "pages/page"
* "pages/product"
* "pages/search"
* "pages/sitemap"
* "pages/subscribed"
* "pages/account/wishlist-details"
* "pages/account/wishlists"

These page types will correspond to the pages within your theme. Each one of these page types map to an ES6 module that extends the base `PageManager` abstract class.

```javascript
    export default class Auth extends PageManager {
        constructor() {
            // Set up code goes here; attach to internals and use internals as you would 'this'
        }
    }
```

### JS Template Context Injection
Occasionally you may need to use dynamic data from the template context within your client-side theme application code.

Two helpers are provided to help achieve this.

The inject helper allows you to compose a JSON object with a subset of the template context to be sent to the browser.

```
{{inject "stringBasedKey" contextValue}}
```

To retrieve the parsable JSON object, just call `{{jsContext}}` after all of the `{{@inject}}` calls.

For example, to setup the product name in your client-side app, you can do the following if you're in the context of a product:

```html
{{inject "myProductName" product.title}}

<script>
// Note the lack of quotes around the jsContext handlebars helper, it becomes a string automatically.
var jsContext = JSON.parse({{jsContext}}); // jsContext would output "{\"myProductName\": \"Sample Product\"}" which can feed directly into your JavaScript

console.log(jsContext.myProductName); // Will output: Sample Product
</script>
```

You can compose your JSON object across multiple pages to create a different set of client-side data depending on the currently loaded template context.

The stencil theme makes the jsContext available on both the active page scoped and global PageManager objects as `this.context`.

## Polyfilling via Feature Detection
Cornerstone implements [this strategy](https://philipwalton.com/articles/loading-polyfills-only-when-needed/) for polyfilling.

In `templates/components/common/polyfill-script.html` there is a simple feature detection script which can be extended to detect any recent JS features you intend to use in your theme code.

If any one of the conditions is not met, an additional blocking JS bundle configured in `assets/js/polyfills.js` will be loaded to polyfill modern JS features before the main bundle executes.

This intentionally prioritizes the experience of the 90%+ of shoppers who are on modern browsers in terms of performance, while maintaining compatibility (at the expense of additional JS download+parse for the polyfills) for users on legacy browsers.

## Static assets
Some static assets in the Stencil theme are handled with Grunt if required. This
means you have some dependencies on grunt and npm. To get started:

First make sure you have Grunt installed globally on your machine:

```
npm install -g grunt-cli
```

and run:

```
npm install
```

Note: package-lock.json file was generated by Node version 10 and npm version 6.11.3. The app supports Node 10 as well as multiple versions of npm, but we should always use those versions when updating package-lock.json, unless it is decided to upgrade those, and in this case the readme should be updated as well. If using a different version for node OR npm, please delete the package-lock.json file prior to installing node packages and also prior to pushing to github.

If updating or adding a dependency, please double check that you are working on Node version 10 and npm version 6.11.3 and run ```npm update <package_name>```  or ```npm install <package_name>``` (avoid running npm install for updating a package). After updating the package, please make sure that the changes in the package-lock.json reflect only the updated/new package prior to pushing the changes to github.


### Icons
Icons are delivered via a single SVG sprite, which is embedded on the page in
`templates/layout/base.html`. It is generated via a grunt task `grunt svgstore`.

The task takes individual SVG files for each icon in `assets/icons` and bundles
them together, to be inlined on the top of the theme, via an ajax call managed
by svg-injector. Each icon can then be called in a similar way to an inline image via:

```
<svg><use xlink:href="#icon-svgFileName" /></svg>
```

The ID of the SVG icon you are calling is based on the filename of the icon you want,
with `icon-` prepended. e.g. `xlink:href="#icon-facebook"`.

Simply add your new icon SVG file to the icons folder, and run `grunt svgstore`,
or just `grunt`.
