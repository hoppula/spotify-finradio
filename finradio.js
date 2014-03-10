require([
  '$api/models',
  '$api/search',
  '$views/list#List',
  '$views/throbber#Throbber',
  'sites'
], function(
  models,
  search,
  List,
  Throbber,
  sites
) {

  function yql(query, format) {
    return $.ajax({
      url: "http://query.yahooapis.com/v1/public/yql?callback=?",
      data: {format: (format || 'json'), q: query},
      dataType: "jsonp"
    });
  }

  function fetch(url, selector, format) {
    return yql("select * from html where url=\""+url+"\" and xpath=\""+css2xpath(selector)+"\"", format);
  }

  function createPlaylist(title) {
    var deferred = $.Deferred();
    models.Playlist.create(title).done(function(temp) {
      temp.load('tracks').done(function(playlist) {
        deferred.resolve(playlist);
      });
    });
    return deferred.promise();
  }

  function createTemporaryPlaylist(id) {
    var deferred = $.Deferred();
    models.Playlist.createTemporary(id+"_"+new Date().getTime()).done(function(temp) {
      temp.load('tracks').done(function(playlist) {
        deferred.resolve(playlist);
      });
    });
    return deferred.promise();
  }

  function createPlaylistFromURI(uri) {
    var deferred = $.Deferred();
    models.Playlist.fromURI(uri).load('tracks').done(function(playlist) {
      deferred.resolve(playlist);
    });
    return deferred.promise();
  }

  function Site(id) {
    this.id = id;
    this.site = sites[id];
    this.throbber = Throbber.forElement($(this.site.view)[0]);
  }

  Site.prototype.fetch = function() {
    var self = this;
    return fetch(this.site.url, this.site.selector, this.site.format).then(function(data) {
      return $.when(self.site.format === "xml" ? data.results : data.query.results);
    });
  };

  Site.prototype.addTracks = function(playlist) {
    var deferred = $.Deferred();
    var trackDeferreds = this.trackList.map(function(str) {
      var trackDeferred = $.Deferred();
        search.Search.search(str).tracks.snapshot(0,1).done(function(snapshot) {
          playlist.tracks.add(snapshot.get(0)).done(function() {
            trackDeferred.resolve();
          });
        });
      return trackDeferred.promise();
    });

    $.when.apply($, trackDeferreds).done(function() {
      deferred.resolve(playlist);
    });

    return deferred.promise();
  };

  Site.prototype.createPlaylist = function(html) {
    var self = this;
    this.trackList = this.site.trackList(html);

    if (typeof(this.trackList) === "object") {
      return createTemporaryPlaylist(this.id).then(function(playlist) {
        return self.addTracks(playlist);
      });
    } else {
      return createPlaylistFromURI(this.trackList);
    }
  };

  Site.prototype.renderPlaylist = function(playlist) {
    this.playlist = playlist;
    this.list = List.forPlaylist(this.playlist);
    $(this.site.view).append(this.list.node);
    this.list.init();
    this.throbber.hide();
  };

  Site.prototype.addPlaylist = function() {
    var self = this;
    createPlaylist(this.site.title).then(function(playlist) {
      self.playlist.tracks.snapshot().done(function(snapshot) {
        for (var i = 0; i < snapshot.length; i++) {
          playlist.tracks.add(snapshot.get(i))
        };
      });
    });
  };

  Site.prototype.show = function() {
    $("#"+this.id+"_container").show();
  };

  $(function() {

    var Sites = sites.list.reduce(function(obj, id) {
      obj[id] = new Site(id);
      return obj;
    }, {});

    for (var id in Sites) {
      if (Sites.hasOwnProperty(id)) {
        var site = Sites[id];
        site.fetch().then(site.createPlaylist.bind(site)).done(site.renderPlaylist.bind(site));
      }
    }

    models.application.addEventListener('arguments', function(args) {
      $('#content div.container').hide();
      Sites[args.target.arguments[0]].show();
    });

    $('.add-playlist').on("click", function(event) {
      event.preventDefault();
      Sites[event.target.value].addPlaylist();
    });

  });

});