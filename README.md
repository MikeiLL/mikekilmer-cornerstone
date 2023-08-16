# Cornerstone Kilmer
![tests](https://github.com/bigcommerce/cornerstone/workflows/Theme%20Bundling%20Test/badge.svg?branch=master)


## Mike Kilmer Notes on the Project

I had [this Big Commerce sandbox store](https://sandbox-test-for-big-bald-guy.mybigcommerce.com) sitting around so installed the theme there, with the Special Item in it's category.

The Stencil CLI is sweet. Read some docs: [Big Commerce Dev](https://developer.bigcommerce.com), [webdav](https://support.bigcommerce.com/s/article/File-Access-WebDAV?language=en_US), [Stencil](https://stenciljs.com/docs/cli), [mustachejs](https://github.com/janl/mustache.js), [Handlebar Helpers](https://developer.bigcommerce.com/stencil-docs/reference-docs/handlebars-helpers-reference), [API Guides](https://developer.bigcommerce.com/api-docs/getting-started/about-our-api), [BC Rest](https://developer.bigcommerce.com/docs/rest-storefront), [GraphQl with reference to Stencil theme](https://developer.bigcommerce.com/api-docs/storefront/graphql/graphql-api-overview).

### Brief Overview of Test

* Wish I had read this README sooner! Whoops.

#### The Image Swap
* Files modified: `components/common/responsive-img.html`, `components/products/card.html`.
* Initially, from within `product-listing.html`, injected the `category.products`` into `jsContext`.
* Decided on more mustache-centric approach: adding the alternate image to the image dataset within Mustache template.
* Noticed that `products/card` component also has `images` in its scope, so pass those into `responsive-image`
* Spent some time getting a workable `{{#if }}` in case there's only a single image.
* * Was hoping for something like `altImage=images.1.data || false`, but no luck.
* * `Parse error on line 73: ...Image=images.1.data` without telling me which file the error occured in. Arrg. 🤯
* Every templating system has it's quirks.
* Added `onmouseover` and `onmouseout` to swap out the `srcset`, which won't have ancient browser support.
* Using a second image element and animating the swap would be more elegant.

#### Add all to cart
* Files modified: `assets/js/theme/category.js`.
* Well, first I worked up a version using multiple calls to `utils.api.cart.itemAdd`
* * (and was annoyed there wasn't a method to add multiple items to the cart.)
* Then looked back at the specification to utilize the Storefront API.
* * This confused me at first as I'm used to seeing those requests from a server.
* * Am curious how Stencil achieves the requests and imagine it proxies through the back end.
* I expect there's an easy way to get all products from a specific category, but for now just grabbing from DOM.
* * (...with jQuery, since it's loaded anyway.)
* Then loop through and build up an object to use to update the cart.
* If there isn't a cart, create one; if there is, add to it.

#### Remove All from cart
* Files modified: `assets/js/theme/category.js`.
* The spec just said to empty the cart if there's at least one thing in it, so, simple.
* Also `hide()` the button when cart empty.

#### User Buttons and Feedback for both of the above
##### NOTE: Theme default seems to be to redirect to cart page when item added.
* Files modified: `assets/js/theme/category.js`, `assets/js/theme/global/modal.js`, `templates/components/common/header.html`, `templates/components/common/alert-modal.html`
* Shortcut for only specialty items cat with: `this.context.template === 'pages/custom/category/special-items'`.
* * Expect might be more elegant to subclass `Category` class and load it into one of my custom template pages.
* Append one or two buttons and a notification area to (and after) the `$('form.actionBar')`.
* Noticed the theme has a Modal.js, which, perhaps, would be a preferable alternative.
* * Actually, this morning I decided to try it, and it is in use when all items removed. Note files modified above.
* * I see that there is already a success modal template, but it's only referenced in other templates, so went with this approach for now.
* * SVG, potentially via CSS class, maybe more elegant than the (font-dependent) Unicode elements currently added to alert modal template.
* Spent minimal time on U/X and styling.


#### Logged In User Details Banner
* Files modified: `templates/components/common/header.html`
* Again, comparing template `{{#if template '==' 'pages/custom/category/special-items'}}`
* Took about ten (okay probably 20) minutes, now that I (kind of) get mustache.js.
* `{{#if customer}}` then `{{ customer.name }}` etc...
* Added an svg icon because it was "free".

## Comments and Questions about the theme and toolset
* Nice aria features. Glad accessibility is a priority for BC.
* Are `secrets.stencil` and `config.stencil` supposed to be included in the theme directory?
* Curious that Grunt.js seems to be utilized for SVG compilation, and maybe other assets.
* * Would expect there's a library available to include in Webpack pipeline.
