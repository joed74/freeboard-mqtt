freeboard.addStyle('.slideshow-next,.slideshow-prev',"icursor: pointer;position: absolute;top: 50%;width: auto;margin-top: -22px;padding: 6px;color: white;font-weight: bold;font-size: 18px;transition: 0.6s ease;border-radius: 0 3px 3px 0;user-select: none;");
freeboard.addStyle('.slideshow-next',"right:0;border-radius: 3px 0 0 3px;");
freeboard.addStyle('.slideshow-prev:hover,.slideshow-next:hover',"background-color: rgba(0,0,0,0.8);");
var slideShowWidget = function(settings)
{
    var self = this;
    var widgetElement;
    var imagePath;
    var allpics;
    var actpic;
    var prev = $('<a class="slideshow-prev">&#10094;</a>');
    var next = $('<a class="slideshow-next">&#10095;</a>');

    this.updateImage = function(pic)
    {
        if(widgetElement && imagePath && (typeof pic !== 'undefined'))
        {
         	var cacheBreakerURL = imagePath + '/' + allpics[pic].text + (imagePath.indexOf("?") == -1 ? "?" : "&") + Date.now(), img = new Image();
		img.onload = function() {
			$(widgetElement).css({
				"background-image" :  "url(" + cacheBreakerURL + ")"
			});
		}
		img.src = cacheBreakerURL;
		if (pic==0) {
			$(prev).hide();
		} else {
			$(prev).show();
		}
		if (pic==allpics.length-1) {
			$(next).hide();
		} else {
			$(next).show();
		}
        }
    }

    this.render = function(element)
    {
        $(element).css({
            width : "100%",
            height: "100%",
            "background-size" : "contain",
            "background-position" : "center",
		"background-repeat" : "no-repeat"
        });
	$(element).append(prev).append(next);
	$(prev).on('click',function() { actpic=actpic-1; self.updateImage(actpic); }).hide();
	$(next).on('click',function() { actpic=actpic+1; self.updateImage(actpic); }).hide();
        widgetElement = element;
    }

    this.onSettingsChanged = function(newSettings)
    {
	if(newSettings.src)
	{
	    $.get(newSettings.src, function(data) {
		imagePath = newSettings.src;
                allpics=$(data).find('a[href$="jpg"],a[href$="png"]');
		actpic=allpics.length-1;
		self.updateImage(actpic);
	    });
	}
    }

    this.getHeight = function()
    {
        return 4;
    }

    this.onSettingsChanged(settings);
};

freeboard.loadWidgetPlugin({
    type_name: "slideshow",
    display_name: "SlideShow",
    fill_size: true,
    settings: [
        {
            name: "src",
            display_name: "Path",
	    description: "Path on server",
            type: "text"
        }
    ],
    newInstance: function (settings, newInstanceCallback) {
        newInstanceCallback(new slideShowWidget(settings));
    }
});
