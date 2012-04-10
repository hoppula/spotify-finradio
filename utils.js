var Utils = {
  yql: function(query,options,fn,context) {
    var self = this;
    var result;
    var format = options.format || "json";
    if (options.itemPath) var itemPath = options.itemPath.split(".");
    
    if (this.getCachedResult(query) && options.cache) {
      fn.call(context,this.getCachedResult(query));
    } else {
      if (format === "json") {
        $.getJSON("http://query.yahooapis.com/v1/public/yql?callback=?", {q: query, format: "json"}, function(json) {
          var result = self.getPath(json.query.results,itemPath);
          if (options.cache) {
            self.cacheResult(query, options.cache, result, function(cachedResult) {
              fn.call(context,cachedResult);
            });
          } else {
            fn.call(context,result);
          }
        });
      } else if (format === "xml") {
        $.get("http://query.yahooapis.com/v1/public/yql?q="+query, function(xml) {
          if (options.cache) {
            self.cacheResult(query, options.cache, xml, function(cachedResult) {
              fn.call(context,cachedResult);
            });
          } else {
            fn.call(context,xml);
          }
        });
      }
    }
  },

  json: function(url,options,fn) {
    this.yql("select * from json where url=\""+url+"\"",options, function(json) {
      fn(json);
    });
  },

  html: function(url,selector,options,fn) {
    var self = this;
    options.format = options.format || "xml";
    this.yql("select * from html where url=\""+url+"\" and xpath=\""+css2xpath(selector)+"\"",options, function(html) {
      if (html) {
        fn(html);
      }
    });
  },

  rss: function(url,options,fn) {
    options.itemPath = options.itemPath || "item";
    this.yql("select * from rss where url=\""+url+"\"", options, function(rss) {
      fn(rss);
    });
  },
    
  localStore: {
    get: function(id) {
      return JSON.parse(window.localStorage.getItem(id));
    },
    set: function(id,data) {
      if (data) {
        window.localStorage.setItem(id, JSON.stringify(data));
      }
    },
    remove: function(id) {
      window.localStorage.removeItem(id);
      return true;
    }
  },
    
  cache: {
    get: function(id) {
      return Utils.localStore.get("Utils.cache."+id);
    },
    set: function(id,data) {
      Utils.localStore.set("Utils.cache."+id, data);
      return true;
    },
    remove: function(id) {
      Utils.localStore.remove("Utils.cache."+id);
      return true;
    }
  },

  getPath: function(obj,path) {
    if(!path) return obj;
    $.each(path, function(i,level) { obj = obj[level]; });
    return obj;
  },

  cleanKey: function(key) {
    return key.replace(/(:|\&.+;|\.|\/|=|\*|'|\&|\?)+/g,"_").replace(/\s+/g,"_");
  },

  cacheResult: function(key,time,result,callback) {
    var expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + time);
    var obj = {time: expiration, result: result};
    var storageId = this.cleanKey(key);
    this.cache.remove(storageId);
    this.cache.set(storageId, obj);
    if(callback) callback(result);
  },

  getCachedResult: function(key) {   
    var cached = this.cache.get(this.cleanKey(key));
    if(cached) {
      var cached_time = cached.time.replace(/\D/g," ").split(" ");
      cached_time[1] --;
      var utcDate = new Date(Date.UTC(cached_time[0],cached_time[1],cached_time[2],cached_time[3],cached_time[4],cached_time[5]));
      if(new Date() < utcDate) {
        return cached.result;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
}

exports = Utils;