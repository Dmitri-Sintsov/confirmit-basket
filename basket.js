'use strict';

void function(App, window, document) {

    App.assert = function(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    };

    App.shallowClone = function(instance) {
        return Object.assign(Object.create(Object.getPrototypeOf(instance)), instance);
    };

    App.deepClone = function(instance) {
        var clone = App.shallowClone(instance);
        for (var key in clone) {
            if (clone.hasOwnProperty(key) && typeof clone[key] === 'object' && clone[key] !==null) {
                clone[key] = App.deepClone(clone[key]);
            }
        }
        return clone;
    };

    /**
     * Coupon begin.
     */
    App.Coupon = function(options) {
        if (options.ratio < 0 || options.ratio > 1) {
            throw new Error('Invalid coupon ratio: ' + options.ratio);
        }
        this.name = options.name;
        this.ratio = options.ratio;
    };

    App.ItemCoupon = function(options) {
        App.Coupon.call(this, options);
    };

    App.ItemCoupon.prototype = (function(ItemCoupon) {

        ItemCoupon.constructor = App.ItemCoupon;

        ItemCoupon.print = function() {
            return 'Item coupon name: ' + this.name + '\n' +
                'Item coupon ratio: ' + this.ratio + '\n';
        };

        return ItemCoupon;

    })(Object.create(App.Coupon.prototype));

    App.BasketCoupon = function(options) {
        App.Coupon.call(this, options);
    };

    App.BasketCoupon.prototype = (function(BasketCoupon) {

        BasketCoupon.constructor = App.BasketCoupon;

        BasketCoupon.print = function() {
            return 'Basket coupon name: ' + this.name + '\n' +
                'Basket coupon ratio: ' + this.ratio + '\n';
        };

        return BasketCoupon;

    })(Object.create(App.Coupon.prototype));

    /**
     * Coupon end.
     */

    /**
     * Shop item begin.
     */
    App.Item = function(options) {
        this.name = options.name;
        this.price = options.price;
    };

    void function(Item) {

        Item.is = function(anotherItem) {
            return anotherItem instanceof App.Item &&
                this.name === anotherItem.name &&
                this.price === anotherItem.price;
        };

        Item.print = function() {
            return 'Item name: ' + this.name + '\n' +
                'Item price: ' + this.price + '\n';
        };

        Item.log = function() {
            var r = this.print();
            console.log(r);
        };

    }(App.Item.prototype);

    /**
     * Shop item end.
     */

    /**
     * Basket item begin.
     */
    App.BasketItem = function(options) {
        this.item = options.item;
        this.count = options.count || 1;
        this.setCoupon(options.coupon || undefined);
    };

    void function(BasketItem) {

        BasketItem.setCoupon = function(coupon) {
            if (coupon !== undefined && !(coupon instanceof App.ItemCoupon)) {
                throw new Error('coupon should be an instance of App.ItemCoupon');
            }
            this.coupon = coupon;
        };

        BasketItem.more = function(count) {
            if (count === undefined) {
                count = 1;
            }
            this.count += count;
        };

        BasketItem.less = function(count) {
            if (count === undefined) {
                count = 1;
            }
            this.count -= count;
            if (this.count < 0) {
                this.count = 0;
            }
        };

        BasketItem.getCost = function() {
            var baseCost = this.item.price * this.count;
            if (this.coupon !== undefined) {
                baseCost *= this.coupon.ratio;
            }
            return baseCost;
        };

        BasketItem.print = function() {
            var result = this.item.print();
            result += 'Number of items: ' + this.count + '\n';
            if (this.coupon !== undefined) {
                result += this.coupon.print();
            }
            result += 'Cost: ' + this.getCost() + '\n';
            return result;
        };

    }(App.BasketItem.prototype);
    /**
     * Basket item end.
     */

    /**
     * Basket begin.
     */
    App.Basket = function(options) {
        this.items = [];
        if (options === undefined) {
            options = {};
        }
        this.setCoupon(options.coupon || undefined);
    };

    void function(Basket) {

        Basket.setCoupon = function(coupon) {
            if (coupon !== undefined && !(coupon instanceof App.BasketCoupon)) {
                throw new Error('coupon should be an instance of App.BasketCoupon');
            }
            this.coupon = coupon;
        };

        Basket.getItemByIdx = function(idx) {
            return this.items[idx];
        };

        Basket.removeItemByIdx = function(idx) {
            this.items.splice(idx, 1);
        };

        Basket.findItemIdx = function(item) {
            var result = -1;
            this.items.every(function(basketItem, idx) {
                if (basketItem.item.is(item)) {
                    result = idx;
                    return false;
                } else {
                    return true;
                }
            });
            return result;
        };

        Basket.findItem = function(item) {
            var basketItemIdx = this.findItemIdx(item);
            return (basketItemIdx === -1) ? undefined : this.getItemByIdx(basketItemIdx);
        };

        /**
         * Warning: The itemCoupon is changed only when it's not undefined.
         */
        Basket.add = function(item, count, itemCoupon) {
            var basketItem;
            if (count === undefined) {
                count = 1;
            }
            var basketItem = this.findItem(item);
            if (basketItem === undefined) {
                basketItem = new App.BasketItem({'item': item, 'count': count})
                this.items.push(basketItem);
            } else {
                basketItem.more(count);
            }
            if (itemCoupon !== undefined) {
                basketItem.setCoupon(itemCoupon);
            }
        };

        Basket.remove = function(item, count) {
            if (count === undefined) {
                count = 1;
            }
            var basketItemIdx = this.findItemIdx(item);
            if (basketItemIdx !== -1) {
                var basketItem = this.getItemByIdx(basketItemIdx);
                basketItem.less(count);
                if (basketItem.count <= 0) {
                    this.removeItemByIdx(basketItemIdx);
                }
            }
        };

        Basket.setCount = function(item, count) {
            if (count === undefined) {
                count = 1;
            }
            var basketItemIdx = this.findItemIdx(item);
            if (basketItemIdx !== -1) {
                if (count <= 0) {
                    this.removeItemByIdx(basketItemIdx);
                } else {
                    var basketItem = this.getItemByIdx(basketItemIdx);
                    basketItem.count = count;
                }
            }
        };

        Basket.getTotalCost = function() {
            var totalCost = this.items.reduce(function(totalCost, basketItem) {
                return totalCost + basketItem.getCost();
            }, 0);
            if (this.coupon !== undefined) {
                totalCost *= this.coupon.ratio;
            }
            return totalCost;
        };

        Basket.print = function() {
            var totalCost = 0;
            var result = '=== Basket begin ===\n';
            this.items.forEach(function(basketItem, idx) {
                totalCost += basketItem.getCost();
                result += basketItem.print();
            });
            if (this.coupon !== undefined) {
                totalCost *= this.coupon.ratio;
                result += this.coupon.print();
            }
            result += 'Total cost: ' + totalCost + '\n' +
                '=== Basket end ===\n';
            return result;
        };

        Basket.log = function() {
            var r = this.print();
            console.log(r);
        };

        Basket.clone = function() {
            return App.deepClone(this);
        };

    }(App.Basket.prototype);

    /**
     * Basket end.
     */

    /**
     * Basket history begin.
     */
    App.BasketHistory = function() {
        this.history = [new App.Basket()];
        this.position = 0;
    };

    void function(BasketHistory) {

        BasketHistory.getPosition = function() {
            return this.position;
        };

        BasketHistory.getCurrentBasket = function() {
            return this.history[this.position];
        };

        BasketHistory.next = function() {
            var nextBasket = this.getCurrentBasket().clone();
            this.history[++this.position] = nextBasket;
            this.history = this.history.slice(0, this.position + 1);
            return nextBasket;
        };

        BasketHistory.add = function(item, count, itemCoupon) {
            var nextBasket = this.next();
            nextBasket.add(item, count, itemCoupon);
        };

        BasketHistory.remove = function(item, count) {
            var nextBasket = this.next();
            nextBasket.remove(item, count);
        };

        BasketHistory.setCount = function(item, count) {
            var nextBasket = this.next();
            nextBasket.setCount(item, count);
        };

        BasketHistory.setCoupon = function(coupon) {
            var nextBasket = this.next();
            nextBasket.setCoupon(coupon);
        };

        BasketHistory.print = function() {
            return this.getCurrentBasket().print();
        };

        BasketHistory.log = function() {
            return this.getCurrentBasket().log();
        };

        BasketHistory.hasUndo = function() {
            return this.position > 0;
        };

        BasketHistory.undo = function() {
            if (this.hasUndo()) {
                return this.history[--this.position];
            } else {
                return this.history[0];
            }
        };

        BasketHistory.hasRedo = function() {
            return this.position < this.history.length - 1;
        };

        BasketHistory.redo = function() {
            if (this.hasRedo()) {
                return this.history[++this.position];
            } else {
                return this.history[this.history.length - 1];
            }
        };

    }(App.BasketHistory.prototype);
    /**
     * Basket history end.
     */

    /**
     * Test begin.
     */
    var teapot = new App.Item({
        name: 'Teapot',
        price: 1000,
    });
    var kettle = new App.Item({
        name: 'Kettle',
        price: 2500,
    });
    var itemCoupon = new App.ItemCoupon({
        name: 'Half price',
        ratio: 0.5,
    });
    var basketCoupon = new App.BasketCoupon({
        name: 'Christmas sale',
        ratio: 0.75,
    });

    teapot.log();
    App.assert(teapot.print() === [
        'Item name: Teapot',
        'Item price: 1000', ''
    ].join('\n'));

    kettle.log();
    App.assert(kettle.print() === [
        'Item name: Kettle',
        'Item price: 2500', ''
    ].join('\n'));

    var basketDumps = [];
    var basket = new App.BasketHistory();
    basket.add(teapot);
    basket.add(kettle);
    basket.add(teapot, 2, itemCoupon);
    basket.log();
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Item name: Teapot',
        'Item price: 1000',
        'Number of items: 3',
        'Item coupon name: Half price',
        'Item coupon ratio: 0.5',
        'Cost: 1500',
        'Item name: Kettle',
        'Item price: 2500',
        'Number of items: 1',
        'Cost: 2500',
        'Total cost: 4000',
        '=== Basket end ===', ''
    ].join('\n'));

    basket.remove(teapot);
    basket.log();
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Item name: Teapot',
        'Item price: 1000',
        'Number of items: 2',
        'Item coupon name: Half price',
        'Item coupon ratio: 0.5',
        'Cost: 1000',
        'Item name: Kettle',
        'Item price: 2500',
        'Number of items: 1',
        'Cost: 2500',
        'Total cost: 3500',
        '=== Basket end ===', ''
    ].join('\n'));

    basket.setCount(kettle, 3);
    basket.remove(teapot, 2);
    basket.log();
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Item name: Kettle',
        'Item price: 2500',
        'Number of items: 3',
        'Cost: 7500',
        'Total cost: 7500',
        '=== Basket end ===', ''
    ].join('\n'));

    basket.setCoupon(basketCoupon);
    basket.log();
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Item name: Kettle',
        'Item price: 2500',
        'Number of items: 3',
        'Cost: 7500',
        'Basket coupon name: Christmas sale',
        'Basket coupon ratio: 0.75',
        'Total cost: 5625',
        '=== Basket end ===', ''
    ].join('\n'));

    do {
        basket.undo();
        basket.log();
        if (basket.getPosition() === 5) {
            App.assert(basket.print() === [
                '=== Basket begin ===',
                'Item name: Teapot',
                'Item price: 1000',
                'Number of items: 2',
                'Item coupon name: Half price',
                'Item coupon ratio: 0.5',
                'Cost: 1000',
                'Item name: Kettle',
                'Item price: 2500',
                'Number of items: 3',
                'Cost: 7500',
                'Total cost: 8500',
                '=== Basket end ===', ''
            ].join('\n'));
        }
    } while(basket.hasUndo());
    App.assert(basket.getPosition() === 0);
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Total cost: 0',
        '=== Basket end ===', ''
    ].join('\n'));

    do {
        basket.redo();
        basket.log();
        if (basket.getPosition() === 3) {
            App.assert(basket.print() === [
                '=== Basket begin ===',
                'Item name: Teapot',
                'Item price: 1000',
                'Number of items: 3',
                'Item coupon name: Half price',
                'Item coupon ratio: 0.5',
                'Cost: 1500',
                'Item name: Kettle',
                'Item price: 2500',
                'Number of items: 1',
                'Cost: 2500',
                'Total cost: 4000',
                '=== Basket end ===', ''
            ].join('\n'));
        }
    } while(basket.hasRedo());
    App.assert(basket.getPosition() === 7);
    App.assert(basket.print() === [
        '=== Basket begin ===',
        'Item name: Kettle',
        'Item price: 2500',
        'Number of items: 3',
        'Cost: 7500',
        'Basket coupon name: Christmas sale',
        'Basket coupon ratio: 0.75',
        'Total cost: 5625',
        '=== Basket end ===', ''
    ].join('\n'));
    /**
     * Test end.
     */

}(window.App = window.App || {}, window, document);
