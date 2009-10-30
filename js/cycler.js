Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

var Cycler = Class.create();
Cycler.prototype = {
    initialize: function(selector, options) {
        this.options = Object.extend(Object.extend({ }, Cycler.DefaultOptions), options || { });

        // grab all the article elements using the selector provided
        var originalArticleElements = $$(selector);

        // if no elements found matching the selector then die
        if (originalArticleElements.length == 0) return;

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

        var wrapper = new Element("div", { style: "relative", "class": this.options.wrapperClass });

        this.cycleRegion.insertBefore(wrapper, this.currentChild);

        var wrappedElements = new Array();

        // only show first article at start up
        first = true;
        this.elementClass = this.options.elementClass;
        this.articleElements.each(function(e) {
            Element.remove(e);
            var wrappedArticle = new Element("div", { "class": this.elementClass });

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
            // if no cycle status div, then we create one with class "cycle-status"
            this.cycleStatus = new Element("div", { "class": this.options.statusClass });
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
        // if no article elements then die
        if (this.articleElements == null) return;
        if (event == null) {
            this.started = true;
        } else if (!this.started) {
            return;
        }

        // switch off is cycling
        //this.cycleStatus.hide();
        if (this.cycleStatus) {
            this.cycleStatus.addClassName(this.options.statusPlayingClass);
            this.cycleStatus.removeClassName(this.options.statusPausedClass);
            this.cycleStatus.innerHTML = this.options.statusPlayingText;
        }

        if (this.scroller != null) this.scroller.stop();
        this.scroller = new PeriodicalExecuter(this.switchIt.bind(this), this.delay);
    },

    stopCycle: function() {
        // switch on if paused
        //this.cycleStatus.show();
        if (this.cycleStatus) {
            this.cycleStatus.addClassName(this.options.statusPausedClass);
            this.cycleStatus.removeClassName(this.options.statusPlayingClass);
            this.cycleStatus.innerHTML = this.options.statusPausedText;
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
        this.currentChild.style.zIndex = this.options.zIndex;

        this.currentChild.visualEffect('appear', { beforeFinish: this.revertArticle.bind(this) });
    },

    revertArticle: function() {
        this.currentChild.style.position = "";
        this.oldChild.hide();
    }
};

Cycler.DefaultOptions = {
    zIndex: 100,
    delay: 5,
    random: false,
    wrapperClass: "cycler-wrapper",
    elementClass: "cycler-element",
    statusClass: "cycler-status",
    statusPausedClass: "paused",
    statusPlayingClass: "playing",
    statusPausedText: "Paused",
    statusPlayingText: "Playing",
    statusElement: false
};