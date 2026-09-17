(function (window, $) {
    if (!$ || !$.fn) {
        return;
    }

    var loading = false;

    try {
        $(window).off('statechange');
    } catch (e) {
    }

    function sameUrl(a, b) {
        try {
            var left = document.createElement('a');
            var right = document.createElement('a');
            left.href = a;
            right.href = b;
            return left.pathname === right.pathname && left.search === right.search;
        } catch (err) {
            return a === b;
        }
    }

    function syncMobileDrawer() {
        var $drawer = $('.mini-cart-wrap.is-filters .mini-cart-content');
        if (!$drawer.length) {
            return;
        }
        var $panel = $('.shop-sidebar-wrap .filters-panel').first();
        if (!$panel.length) {
            $panel = $('.filters-panel').first();
        }
        if ($panel.length) {
            $drawer.html($('<div class="mobile-filters-only"></div>').append($panel.clone()));
        }
    }

    function applyPage(html, url, push) {
        var $src = $('<div>').append($.parseHTML(html, document, false));
        var $listing = $src.find('#category-listing').first();
        var $filters = $src.find('.filters-panel').first();
        var $title = $src.find('title').first();

        if ($listing.length && $('#category-listing').length) {
            $('#category-listing').replaceWith($listing);
        } else if ($listing.length) {
            var $legacy = $('.shop-product-wrap.category_inline, .category_inline.shop-product-wrap').first();
            if ($legacy.length) {
                $legacy.replaceWith($listing.find('.shop-product-wrap').first());
            }
        }

        if ($filters.length) {
            $('.filters-panel').each(function () {
                $(this).replaceWith($filters.clone());
            });
        }

        if ($title.length && $title.text()) {
            document.title = $title.text();
        }

        try {
            if ($.fn.Lazy) {
                $('img').Lazy();
            }
        } catch (err) {
        }

        syncMobileDrawer();

        if (push && url && window.history && history.pushState && !sameUrl(window.location.href, url)) {
            history.pushState({ajaxCat: 1}, document.title, url);
        }
    }

    function loadUrl(url, push) {
        if (!url || loading) {
            return;
        }
        loading = true;
        $('#category-listing, .filters-panel').addClass('is-loading');
        $.get(url, function (html) {
            applyPage(html, url, push !== false);
        }).fail(function () {
            window.location.href = url;
        }).always(function () {
            loading = false;
            $('#category-listing, .filters-panel').removeClass('is-loading');
        });
    }

    function isCatalogLink(href) {
        return href && href !== '#' && href.indexOf('javascript:') !== 0;
    }

    $(document).on('click', '.js-ajax-filter, .filters-panel a[href], #category-listing .pagination a[href]', function (e) {
        var $link = $(this);
        var href = $link.attr('href');
        if (!isCatalogLink(href) || $link.is('[onclick*="return false"]')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        loadUrl(href, true);
    });

    function bindMobileFilters() {
        $(document).off('click', '[data-open-filters-drawer]');
        $(document).on('click', '[data-open-filters-drawer]', function (e) {
            var $source = $('[data-mobile-filters-content]:first');
            var $panel = $source.find('.filters-panel').first();
            if (!$panel.length) {
                $panel = $('.filters-panel').first();
            }
            if (!$panel.length) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            var $mini = $('.mini-cart-content');
            var $wrap = $('.mini-cart-wrap');
            if ($mini.length && $wrap.length) {
                if (!$wrap.data('saved-cart') && !$wrap.hasClass('is-filters')) {
                    $wrap.data('saved-cart', $mini.html());
                }
                $mini.html($('<div class="mobile-filters-only"></div>').append($panel.clone()));
                $('.cart-overlay').addClass('visible');
                $wrap.addClass('open is-filters');
                $('body').css('overflow', 'hidden');
            }
        });
    }

    $(bindMobileFilters);
    setTimeout(bindMobileFilters, 0);

    $(window).on('popstate', function (e) {
        var state = e.originalEvent && e.originalEvent.state;
        if (state && state.ajaxCat) {
            loadUrl(window.location.href, false);
        }
    });

    if ($('#category-listing, .filters-panel').length && window.history && history.replaceState) {
        try {
            history.replaceState({ajaxCat: 1}, document.title, window.location.href);
        } catch (err) {
        }
    }

    var FILTER_GROUPS_VISIBLE = 2;

    function setShowMoreLabel($menu) {
        var $btn = $menu.children('.filters-show-more');
        var extra = parseInt($btn.attr('data-extra'), 10) || 0;
        if (!extra) {
            $btn.hide();
            return;
        }
        $btn.show().text($menu.hasClass('is-expanded') ? 'Свернуть' : 'Показать ещё');
    }

    function initFilterLimits(scope) {
        var $scope = $(scope || document);
        $scope.find('.filters-menu').each(function () {
            var $menu = $(this);
            $menu.children('.filters-group').each(function () {
                var $group = $(this);
                var $items = $group.find('.filters-values > li');
                $items.removeClass('is-extra');
                $group.find('.filters-show-all').remove();
                $group.removeClass('is-expanded');
                if ($items.length <= 1) {
                    $group.addClass('is-singleton').removeClass('is-extra-group').hide();
                    return;
                }
                $group.removeClass('is-singleton').show();
            });

            var shown = 0;
            $menu.children('.filters-group').not('.is-singleton').each(function () {
                var $group = $(this);
                var selected = $group.find('a.current').length > 0;
                if (selected || shown < FILTER_GROUPS_VISIBLE) {
                    shown += 1;
                    $group.removeClass('is-extra-group');
                    return;
                }
                $group.addClass('is-extra-group');
            });

            var extra = $menu.children('.filters-group.is-extra-group').length;
            var $btn = $menu.children('.filters-show-more');
            if (extra && !$btn.length) {
                $btn = $('<button type="button" class="filters-show-more"></button>');
                var $reset = $menu.children('.filters-reset-wrap');
                if ($reset.length) {
                    $btn.insertBefore($reset);
                } else {
                    $menu.append($btn);
                }
            }
            if ($btn.length) {
                $btn.attr('data-extra', extra);
            }
            setShowMoreLabel($menu);
        });
    }

    $(document).off('click.filtersShowMore click.filtersShowAll');
    $(document).on('click.filtersShowMore', '.filters-show-more', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var $menu = $(this).closest('.filters-menu');
        $menu.toggleClass('is-expanded');
        setShowMoreLabel($menu);
    });

    initFilterLimits(document);
    var _origApplyPage = applyPage;
    applyPage = function (html, url, push) {
        _origApplyPage(html, url, push);
        initFilterLimits(document);
    };
})(window, window.jQuery);
