/**
 * @file
 * Flexible slider by Joe Kirchhof.
 *
 * ES5-compatible. Requires support for element.classList and transitionEnd
 * without a browser prefix.
 */

(function () {

  "use strict";

  window.flexibleSliderEvents = window.flexibleSliderEvents ||
    {
      slideOutgoing : new Event('slideOutgoing', {bubbles: true}),
      slideIncoming : new Event('slideIncoming', {bubbles: true})
    };

  var findSliders = window.findSliders = function (context) {
    context = context || document;
    var unbuiltSliders, i;
    unbuiltSliders = context.querySelectorAll(".slider-container:not(.slider-built)");
    for (i = 0; i < unbuiltSliders.length; i++) {
      new Slider({
        autoPlay : unbuiltSliders[i].classList.contains("slider-autoplay"),
        originalContainer : unbuiltSliders[i]
      });
    }
  };

  var Slider = function (sliderOptions) {
    var option;
    var options = {
      autoPlay : false,
      autoPlayTiming : 6000,
      originalContainer : null
    };
    for (option in sliderOptions) {
      options[option] = sliderOptions[option];
    }
    this.autoPlayTiming = options.autoPlayTiming;
    this.sliderContainer = options.originalContainer;
    this.sliderContainer.classList.add('slider-built');
    this.showingSlide = -1;
    this.builtSlides = [];
    this.buildSlider();
    if (options.autoPlay) {
      this.playAutoPlay();
      this.maybeAutoPlay();
    }
    else {
      this.pauseAutoPlay();
      this.sliderNext();
    }
  };

  Slider.prototype = {

    allowSliding : true,

    autoPlayTimeout : false,

    buildSlider : function () {
      var slideContents, i, sliderSlides,
          sliderControls, sliderControlDirectWrapper,
          sliderControlPlayPauseWrapper, sliderControlPlay, sliderControlPause,
          sliderControlPrevWrapper, sliderControlPrev,
          sliderControlNextWrapper, sliderControlNext;

      sliderSlides = document.createElement("div");
      sliderSlides.classList.add("slider-slides");

      sliderControls = document.createElement("div");
      sliderControls.classList.add("slider-controls");

      sliderControlDirectWrapper = document.createElement("div");
      sliderControlDirectWrapper.classList.add("slider-control-direct-wrapper");
      sliderControlDirectWrapper.classList.add("slider-control-wrapper");

      sliderControlPlayPauseWrapper = document.createElement("div");
      sliderControlPlayPauseWrapper.classList.add("slider-control-play-pause-wrapper");
      sliderControlPlayPauseWrapper.classList.add("slider-control-wrapper");
      sliderControlPlay = document.createElement("a");
      sliderControlPlay.classList.add("slider-control-play");
      sliderControlPlay.classList.add("slider-control");
      sliderControlPause = document.createElement("a");
      sliderControlPause.classList.add("slider-control-pause");
      sliderControlPause.classList.add("slider-control");
      sliderControlPlayPauseWrapper.appendChild(sliderControlPlay);
      sliderControlPlayPauseWrapper.appendChild(sliderControlPause);

      sliderControlPrevWrapper = document.createElement("div");
      sliderControlPrevWrapper.classList.add("slider-control-prev-wrapper");
      sliderControlPrevWrapper.classList.add("slider-control-wrapper");
      sliderControlPrev = document.createElement("a");
      sliderControlPrev.classList.add("slider-control-prev");
      sliderControlPrev.classList.add("slider-control");
      sliderControlPrevWrapper.appendChild(sliderControlPrev);

      sliderControlNextWrapper = document.createElement("div");
      sliderControlNextWrapper.classList.add("slider-control-next-wrapper");
      sliderControlNextWrapper.classList.add("slider-control-wrapper");
      sliderControlNext = document.createElement("a");
      sliderControlNext.classList.add("slider-control-next");
      sliderControlNext.classList.add("slider-control");
      sliderControlNextWrapper.appendChild(sliderControlNext);

      sliderControls.appendChild(sliderControlPlayPauseWrapper);
      sliderControls.appendChild(sliderControlPrevWrapper);
      sliderControls.appendChild(sliderControlDirectWrapper);
      sliderControls.appendChild(sliderControlNextWrapper);

      slideContents = this.sliderContainer.querySelectorAll(".slider-slide-content");
      for (i = 0; i < slideContents.length; i++) {
        this.buildSlide(slideContents[i], i);
        sliderSlides.appendChild(this.builtSlides[i].slide);
        sliderControlDirectWrapper.appendChild(this.builtSlides[i].controlEl);
      }

      (function (slider) {
        sliderControlPrev.addEventListener('click', function (e) {
          e.preventDefault();
          slider.pauseAutoPlay();
          slider.sliderPrev();
        }, false);
        sliderControlNext.addEventListener('click', function (e) {
          e.preventDefault();
          slider.pauseAutoPlay();
          slider.sliderNext();
        }, false);
        sliderControlPlay.addEventListener('click', function (e) {
          e.preventDefault();
          slider.playAutoPlay();
        }, false);
        sliderControlPause.addEventListener('click', function (e) {
          e.preventDefault();
          slider.pauseAutoPlay();
        }, false);
      })(this);

      this.sliderContainer.appendChild(sliderSlides);
      this.sliderContainer.appendChild(sliderControls);
    },

    buildSlide : function (slideContent, slideNumber) {
      var builtSlide, controlEl;
      if (slideContent.nodeName.toLowerCase() == "img" && slideContent.src != "") {
        // Get src & div with backgroundImage.
        builtSlide = document.createElement("div");
        builtSlide.style.backgroundImage = "url(" + slideContent.src + ")";
      }
      else {
        builtSlide = slideContent.cloneNode(true);
        // Clone does not contain event listeners.
        builtSlide.classList.remove("slider-slide-content");
      }
      builtSlide.classList.add("slider-slide");
      // Build control element.
      controlEl = document.createElement("a");
      controlEl.classList.add("slider-control-direct");
      controlEl.classList.add("slider-control");
      (function (slider,slideNumber) {
        controlEl.addEventListener('click', function (e) {
          e.preventDefault();
          slider.pauseAutoPlay();
          slider.sliderGoTo(slideNumber);
        }, false);
      })(this, slideNumber);
      this.builtSlides.push({slide: builtSlide, controlEl: controlEl});
      slideContent.parentNode.removeChild(slideContent);
    },

    sliderGoTo : function (slideNumber) {
      if (this.showingSlide != slideNumber) {
        this.slideDirection = this.showingSlide < slideNumber ? 1 : -1;
        this.showingSlide = slideNumber;
        this.slide();
      }
    },

    sliderNext : function () {
      this.showingSlide++;
      if ((this.builtSlides.length - 1) < this.showingSlide) {
        this.showingSlide = 0;
      }
      this.slideDirection = 1;
      this.slide();
    },

    sliderPrev : function () {
      this.showingSlide--;
      if (0 > this.showingSlide) {
        this.showingSlide = this.builtSlides.length - 1;
      }
      this.slideDirection = -1;
      this.slide();
    },

    maybeAutoPlay : function () {
      if (this.autoPlaying) {
        (function (slider) {
          slider.autoPlayTimeout = window.setTimeout(function () {
            slider.sliderNext();
          }, slider.autoPlayTiming);
        })(this);
      }
    },

    pauseAutoPlay : function () {
      this.autoPlaying = false;
      this.sliderContainer.classList.add("slider-paused");
      this.sliderContainer.classList.remove("slider-playing");
      if (typeof this.autoPlayTimeout == "number") {
        window.clearTimeout(this.autoPlayTimeout);
      }
    },

    playAutoPlay : function () {
      this.autoPlaying = true;
      this.sliderContainer.classList.add("slider-playing");
      this.sliderContainer.classList.remove("slider-paused");
      this.sliderNext();
    },

    slide : function () {
      if (!this.allowSliding) {
        return;
      }
      if (typeof this.autoPlayTimeout == "number") {
        window.clearTimeout(this.autoPlayTimeout);
      }
      var i;
      for (i = 0; i < this.builtSlides.length; i++) {
        if (this.showingSlide == i) {
          if (!this.builtSlides[i].slide.classList.contains("slider-slide-current")) {
            if (this.slideDirection == -1) {
              this.builtSlides[i].slide.classList.add("slider-slide--enter-from-reverse");
            }
            // .03 second delay allows DOM redraw in case the class
            // 'slider-slide--enter-from-reverse' is added to incoming slide.
            (function (builtSlide) {
              window.setTimeout(function () {
                builtSlide.slide.classList.add("slideable");
                builtSlide.slide.classList.add("slider-slide-current");
                builtSlide.controlEl.classList.add("slider-control-current");
              }, 30);
            })(this.builtSlides[i]);
            // Dispatch custom event, with event.target set to incoming slide.
            // Note that event occurs .03 seconds before slide transition
            // begins (because of above setTimeout call).  Event handler should
            // accomodate this delay as as well as the slide transition time.
            this.builtSlides[i].slide.dispatchEvent(window.flexibleSliderEvents.slideIncoming);
          }
        }
        else {
          if (this.builtSlides[i].slide.classList.contains("slider-slide-current")) {
            this.allowSliding = false;
            if (this.slideDirection == -1) {
              this.builtSlides[i].slide.classList.add("slider-slide-outgoing--reverse");
            }
            this.builtSlides[i].slide.classList.add("slider-slide-outgoing");
            this.builtSlides[i].slide.classList.remove("slider-slide-current");
            this.builtSlides[i].slide.classList.remove("slider-slide--enter-from-reverse");
            this.builtSlides[i].controlEl.classList.remove("slider-control-current");
            (function (slider, outgoing) {
              var transitionEndEvent = 'transitionend';
              outgoing.addEventListener(transitionEndEvent, function f() {
                slider.afterSlide(outgoing,transitionEndEvent, f);
                // Listener is automatically removed in FF & Chrome ; should be
                // able to delete removeEventListener call in future.
                outgoing.removeEventListener(transitionEndEvent, f);
              }, {once: true});
            })(this, this.builtSlides[i].slide);
            // Dispatch custom event, with event.target set to outgoing slide.
            // Note that event occurs when slide transition begins. Event
            // handler should accomodate this delay as as well as the slide
            // transition time.
            this.builtSlides[i].slide.dispatchEvent(window.flexibleSliderEvents.slideOutgoing);
          }
        }
      }
    },

    afterSlide : function (outgoing) {
      if (outgoing.classList.contains("slider-slide-outgoing")) {
        outgoing.classList.remove("slideable");
        outgoing.classList.remove("slider-slide-outgoing");
        outgoing.classList.remove("slider-slide-outgoing--reverse");
        (function (slider) {
          window.setTimeout(function () {
            slider.allowSliding = true;
            // If slides were prevented during transition,
            // this runs the last one of those, using state set by
            // the call that wasn't allow to slide.
            slider.slide();
            slider.maybeAutoPlay();
          },10);
        })(this);
      }
    }

  };

})();
