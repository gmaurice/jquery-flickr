/*****************************************
 * Original Flickr API (in jQuery) by Ryan Heath (http://rpheath.com)
 * Changes by Daniel Lopes (09/10/2009)
 * written for jQuery 1.3.2
 *****************************************/
(function($) {
  // core extensions
  $.extend({
    // determines if an object is empty
    // $.isEmpty({})             // => true
    // $.isEmpty({user: 'rph'})  // => false
    isEmpty: function(obj) {
      for (var i in obj) { return false; }
      return true;
    }
  });

  // base flickr object
  $.flickr = {
    // the actual request url
    // (constructs extra params as they come in)
    url: function(method, params) {
      return 'http://api.flickr.com/services/rest/?method=' + method + '&format=json' +
        '&api_key=' + $.flickr.settings.api_key + ($.isEmpty(params) ? '' : '&' + $.param(params)) + '&jsoncallback=?';
    },
    // translate plugin image sizes to flickr sizes
    translate: function(size) {
      switch(size) {
        case 'sq': return '_s'; // square
        case 't' : return '_t'; // thumbnail
        case 's' : return '_m'; // small
        case 'm' : return '';   // medium
        default  : return '';   // medium
      }
    },
    // determines what to do with the links
    linkTag: function(text, photo, href) {
      if (href === undefined) 
        href = ['http://www.flickr.com/photos', photo.owner, photo.id].join('/');
      return '<a href="' + href + '" title="' + photo.title + '" target="_blank">' + text + '</a>';
    }
  };

  // helper methods for thumbnails
  $.flickr.thumbnail = {
    src: function(photo, size) {
      if (size === undefined) 
        size = $.flickr.translate($.flickr.settings.thumbnail_size);
      return 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + size + '.jpg';
    },
    imageTag: function(image) {
      return '<img src="' + image.src + '" alt="' + image.alt + '" />';
    }
  };

  // accepts a series of photos and constructs
  // the thumbnails that link back to Flickr
  $.flickr.thumbnail.process = function(photos) {
    var thumbnails = $.map(photos.photo, function(photo) {
      var image = new Image(), html = '', href = undefined;

      image.src = $.flickr.thumbnail.src(photo);
      image.alt = photo.title;

      var size = $.flickr.settings.link_to_size;
      if (size != undefined && size.match(/sq|t|s|m|o/))
        href = $.flickr.thumbnail.src(photo, $.flickr.translate(size));

      html = $.flickr.linkTag($.flickr.thumbnail.imageTag(image), photo, href);

      return ['<li>' + html + '</li>'];
    }).join("\n");

    return $('<ul class="flickr"></ul>').append(thumbnails);
  };

  // handles requesting and thumbnailing photos
  $.flickr.photos = function(method, options, pagination) {
    var options = $.extend($.flickr.settings, options || {});
    var elements = $.flickr.self;
    var photos, totalPages;

    elements.each(function() {
      $.getJSON($.flickr.url(method, options), function(data) {
        if (data.stat != "fail"){
          photos = (data.photos === undefined ? data.photoset : data.photos);
          elements.html($.flickr.thumbnail.process(photos));

          if(pagination !== undefined){
            pagination.page.html(photos.page);
            pagination.pages.text(photos.pages);
          }

        }
      });
    });
  };

  $.flickr.photosets = function(options,callback) {
    var options  = $.extend($.flickr.settings, options || {});
    $.getJSON($.flickr.url('flickr.photosets.getList', options), function(data) {
      $.map(data.photosets.photoset, function(photoset) {
        $.flickr.self.append("<option value="+photoset.id+">"+photoset.title._content+"</option>");
      });
      callback.call();
    });
  };

  // namespace to hold available API methods
  // note: options available to each method match that of Flickr's docs
  $.flickr.methods = {
    // http://www.flickr.com/services/api/flickr.photos.getRecent.html
    photosGetRecent: function(options) {
      $.flickr.photos('flickr.photos.getRecent', options);
    },
    // http://www.flickr.com/services/api/flickr.photos.getContactsPublicPhotos.html
    photosGetContactsPublicPhotos: function(options) {
      $.flickr.photos('flickr.photos.getContactsPublicPhotos', options);
    },
    // http://www.flickr.com/services/api/flickr.photos.search.html
    photosSearch: function(options) {
      $.flickr.photos('flickr.photos.search', options);
    },
    // http://www.flickr.com/services/api/flickr.photosets.getPhotos.html
    photosetsGetPhotos: function(options,pagination) {
      $.flickr.photos('flickr.photosets.getPhotos', options, pagination);
    },
    // http://www.flickr.com/services/api/flickr.photosets.getList.html
    photosetsGetList: function(options,callback) {
      $.flickr.photosets(options,callback);
    },
    // http://www.flickr.com/services/api/flickr.people.getPublicPhotos.html
    peopleGetPublicPhotos: function(options) {
      $.flickr.photos('flickr.people.getPublicPhotos', options);
    }
  };

  // the plugin
  $.fn.flickr = function(options) {
    $.flickr.self = $(this);

    // base configuration
    $.flickr.settings = $.extend({
      api_key: 'YOUR API KEY',
      thumbnail_size: 'sq'
    }, options || {});

    return $.flickr.methods;
  };
})(jQuery);