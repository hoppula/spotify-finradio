var cache = {
  get: function(id) {
    return Utils.cache.get(id);
  },
  set: function(id,data) {
    Utils.cache.set(id,data);
    return data;
  }
};

var html = {};
var playlists = {};

var sites = {
  "nrj": {
    title: "NRJ - kuumimmat hitit",
    url: "http://www.nrj.fi/kuumimmathitit",
    selector: "div.content p span",
    rendered: false,
    view: function() {
      return $('#nrj');
    },
    render: function(html) {
      playlists.nrj = new models.Playlist();
      var songs = html.span[4].content.split("\n");
      songs.forEach(function(song) {
        var splitted = song.split(":");
        var artist = splitted[0].replace("/",", ");
        var track = splitted[1];
        var str = artist+track;

        getTrack(str, function(track) {
          playlists.nrj.add(models.Track.fromURI(track.uri));
        });
      });

      var list = renderPlayList(playlists.nrj);
      this.view().append(list);
    }
  },
  "ylex": {
    title: function() { 
      return playlists.ylex.data.name;
    },
    url: "http://ylex.yle.fi/",
    selector: "#site-menu ul.secondary-menu",
    rendered: false,
    view: function() {
      return $('#ylex');
    },
    render: function(html) {
      // extract current Spotify playlist url
      var li = html.ul.li.filter(function(li) {
        return li.a.content == "Spotify";
      });
      var link = li[0].a.href;

      playlists.ylex = models.Playlist.fromURI(link);

      var list = renderPlayList(playlists.ylex);
      this.view().append(list);          
    }
  },
  "voice": {
    title: "Voice - soitetuimmat",
    url: "http://voice.fi/soittolista/soitetuimmat",
    selector: "div.sbsmusic_mostplayed",
    rendered: false,
    view: function() { 
      return $('#voice')
    },
    render: function(html) {
      playlists.voice = new models.Playlist();

      var tracks = html.div.div.forEach(function(obj) {
        var info = obj.div[2].a.span;
        var artist = info[0].content;
        var track = info[1].content;

        var str = artist+" "+track;

        getTrack(str, function(track) {
          playlists.voice.add(models.Track.fromURI(track.uri));
        });
      });

      var list = renderPlayList(playlists.voice);
      this.view().append(list);   
    }
  }
} // sites

var getTrack = function(str, callback) {
  var track = cache.get(str);

  if (!track) {
    sp.core.search(str, true, true, {
      onSuccess: function(result) {
        var track = result.tracks[0];
        if (track) {
          cache.set(str, track);
          callback(track);
        }
      }
    });
  } else {
    callback(track);
  }
}

var renderPlayList = function(playlist) {
  var tracksList = new views.List(playlist, function(track) {
    return new views.Track(track, views.Track.FIELD.STAR | views.Track.FIELD.NAME | views.Track.FIELD.DURATION | views.Track.FIELD.ARTIST | views.Track.FIELD.ALBUM);
  });
  tracksList.node.classList.add('sp-light');

  return tracksList.node;
}

var get = function(id,i) {
  var site = sites[id];
  setTimeout(function() {
    Utils.html(site.url, site.selector, {format: "json", cache: 600}, function(response) {
      html[id] = response;
      // TODO: move this extra logic elsewhere
      if (i == 0) {
        site.render(response);
        site.rendered = true;
      }
    });
  }, 300);
}
    
exports = {
  init: function() {
    sp.core.addEventListener("argumentsChanged", this.navigate);
    Object.keys(sites).forEach(function(site,i) {
      get(site,i);
    });
  },
  navigate: function() {
    var id = sp.core.getArguments()[0];
    $('#content div.container').hide();
    var container = $("#"+id+"_container").show();
    if (!sites[id].rendered) {
      sites[id].render(html[id]);
      sites[id].rendered = true;
    }
  },
  addPlayList: function(id) {
    var title = (typeof(sites[id].title) == "function") ? sites[id].title() : sites[id].title;
    var playlist = new models.Playlist(title);
    $.each(playlists[id].tracks, function(i,track) {
      playlist.add(track);
    });
  }
}