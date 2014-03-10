exports.list = ["nrj", "ylex", "voice"];

exports.nrj = {
  title: "NRJ - kuumimmat hitit",
  url: "http://www.nrj.fi/kuumimmathitit",
  selector: "div.content p span",
  view: "#nrj",
  format: "xml",
  trackList: function(html) {
    return $(html[1]).text().split("\n").map(function(song) {
      var splitted = song.split(":");
      var artist = splitted[0].replace("/",", ");
      var track = splitted[1];
      return artist+track;
    });
  }
};

exports.ylex = {
  title: "YleX Soittolista",
  url: "http://ylex.yle.fi/musiikki/soittolista",
  selector: "#soittolista-header li.spotify",
  view: "#ylex",
  trackList: function(html) {
    return html.li.a.href;
  }
};

exports.voice = {
  title: "Voice - soitetuimmat",
  url: "http://voice.fi/soittolista/soitetuimmat",
  selector: "div.sbsmusic_mostplayed div.sbsmusic_mostplayed-song",
  view: "#voice",
  trackList: function(html) {
    return html.div.map(function(obj) {
      var info = (obj.div[1].a) ? obj.div[1].a.span : obj.div[2].a.span;
      return info[0].content+" "+info[1].content;
    });
  }
};