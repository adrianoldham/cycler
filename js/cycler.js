Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

var DEFAULT_DELAY = 5;

var Cycler = Class.create();
Cycler.prototype = {
    initialize: function(articlesSelector, options) {
        this.options = Object.extend({
            delay: DEFAULT_DELAY,
            random: false
            },
            options || {}
        );

        // grab all the article elements using the selector provided
        var originalArticleElements = $$(articlesSelector);

        // randomize cycle
        this.articleElements = new Array();
        while (originalArticleElements.length > 0) {
            var rand = 0;
            if (this.options.random)
                rand = Math.floor(Math.random() * originalArticleElements.length);

            var articleElement = originalArticleElements[rand];
            originalArticleElements.remove(rand);
            this.articleElements.push(articleElement);
        }

        if (this.articleElements.length < 2) return;
        
        this.scroller = null;
        this.currentChild = this.articleElements[0];
        this.delay = this.options.delay;

        // parent of the article elements is the container/cycle region
        this.cycleRegion = this.currentChild.parentNode;

        var wrapper = new Element("div");
        wrapper.style.position = "relative";
        wrapper.addClassName("cycle_wrapper");

        this.cycleRegion.insertBefore(wrapper, this.currentChild);

        var wrappedElements = new Array();

        // only show first article at start up
        first = true;
        this.articleElements.each(function(e) {
            Element.remove(e);
            var wrappedArticle = new Element("div");
            wrappedArticle.addClassName("cycle_element");

            wrappedArticle.appendChild(e);
            wrapper.appendChild(wrappedArticle);
            wrappedElements.push(wrappedArticle);

            if (first == false) wrappedArticle.hide();
            first = false;
        });

        this.currentIndex = 0;
        this.currentChild = wrappedElements[0];

        if (typeof(this.options.statusElement) == "string") {
            // cycle status div is specified
            this.cycleStatus = $(this.options.statusElement);
        }
        else if (typeof(this.options.statusElement) == "boolean" && this.options.statusElement == true) {
            // if no cycle status div, then we create one with class "cycle_status"
            this.cycleStatus = new Element("div");
            this.cycleStatus.addClassName("cycle_status");
            wrapper.insertBefore(this.cycleStatus, this.currentChild);
        }

        //this.cycleStatus.hide();

        // on mouse over, stop cycling
        Event.observe(wrapper, "mouseover", this.stopCycle.bind(this));

        // on mouse out, start cycling again
        Event.observe(wrapper, "mouseout", this.startCycle.bind(this));

        this.cycleRegion = wrapper;
        this.articleElements = wrappedElements;
    },

    startCycle: function(event) {
        if (event == null) {
            this.started = true;
        } else if (!this.started) {
            return;
        }

        // switch off is cycling
        //this.cycleStatus.hide();
        if (this.cycleStatus) {
            this.cycleStatus.addClassName("play");
            this.cycleStatus.removeClassName("pause");
            this.cycleStatus.innerHTML = "Playing";
        }
        
        if (this.scroller != null) this.scroller.stop();
        this.scroller = new PeriodicalExecuter(this.switchIt.bind(this), this.delay);
    },

    stopCycle: function() {
        // switch on if paused
        //this.cycleStatus.show();
        if (this.cycleStatus) {
            this.cycleStatus.addClassName("pause");
            this.cycleStatus.removeClassName("play");
            this.cycleStatus.innerHTML = "Paused";
        }

        if (this.scroller != null) this.scroller.stop();
    },

    switchIt: function() {
        this.oldChild = this.currentChild;
        
        // find the next sibling article with the same class name
        this.currentIndex++;
        this.currentIndex %= this.articleElements.length;
        
        this.currentChild = this.articleElements[this.currentIndex];
        
        // loop back to start if we reach the end
        if (this.currentChild == null) this.currentChild = this.articleElements[0];
        
        this.doTransition();
    },

    doTransition: function() {
        // do transitions
        this.currentChild.style.position = "absolute";
        this.currentChild.style.top = "0";
        this.currentChild.style.left = "0";
        this.currentChild.style.width = "100%";
        this.currentChild.style.zIndex = 100;

        this.currentChild.visualEffect('appear', { beforeFinish: this.revertArticle.bind(this) });
    },

    revertArticle: function() {
        this.currentChild.style.position = "";
        this.oldChild.hide();
    }
}