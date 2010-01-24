// ==UserScript==
// @name         Always Hatebu Favorites
// @namespace    http://d.hatena.ne.jp/LukeSilvia/
// @description  show your hatebu favorites who bookmarked now page
// @include      http://*
// @exclude      http://*.google.*/
// @exclude      http://b.hatena.ne.jp/*
// @require      http://gist.github.com/3242.txt
// @require      http://gist.github.com/raw/283040/da3c24326fcb54b9aa70b04d831584410dde8474/createDocumentFromString.js
// ==/UserScript==

// ==/UserScript==

(function() {
    // one day
    var CACHE_EXPIRE = 24 * 60 * 60 * 1000;

    function getUsername() {
        var url = "http://b.hatena.ne.jp/my";
        var username = GM_getValue('username');

        if(!username){
            GM_xmlhttpRequest({method: "GET",
                               url: url,
                               onload: function(res) {
                                   var html = createDocumentFromString(res.responseText);
                                   var username = $X('//div[@id="navigation"]//a', html)[0].firstChild.title;

                                   if(username) {
                                       GM_setValue('username', username);
                                   }
                               }
                              });
        }

        return username;
    }

    function updateFavorites() {
        var username = getUsername();
        if(!username) return;

        var url = "http://b.hatena.ne.jp/" + username + "/favorite";

        GM_xmlhttpRequest({method: "GET",
                           url: url,
                           onload: function(res) {
                               var expire = new Date(new Date().getTime() + CACHE_EXPIRE);
                               var favorites = {
                                   favorites: [],
                                   expire: expire
                               };
                               var html = createDocumentFromString(res.responseText);
                               var data = $X('//div[@class="hatena-module hatena-module-profile"]//ul//a[@class="profile-icon"]', html);

                               Array.forEach(data, function(a) {
                                   favorites['favorites'].push(a.firstChild.title);
                               });

                               GM_setValue('favorites', favorites.toSource());
                           }
                          });
    }

    function clearCache() {
        GM_setValue('favorites', '');
        GM_setValue('username', '');
    }

    function getUsers() {
        var favorites = eval(GM_getValue('favorites'));

        if(!favorites || favorites.expire < new Date()) {
            updateFavorites();
        }

        return (favorites ? [getUsername()].concat(favorites.favorites) : []);
    }

    function showFavorites(json) {
        var users = getUsers();
        var icons_per_line = 20;
        var bm_users = [];
        var common;
        var data;

        if(data = eval("(" + json.responseText + ")")){
            var div = document.createElement("div");
            div.setAttribute("id", "gm_always_hatebu_favorites");
            div.setAttribute("style", "display:block; position:fixed; bottom:0px; left:0px; z-index:500;  width:" + 16 * icons_per_line + "px; text-align:left;");

            Array.forEach(data.bookmarks, function(b){
                bm_users.push(b.user)
            });

            arrAnd(users, bm_users).forEach(function(u){
                var img = document.createElement("img");

                img.setAttribute("src", "http://www.hatena.ne.jp/users/" + u.substr(0, 2) + "/" + u + "/profile.gif");
                img.setAttribute("height", "16");
                img.setAttribute("width", "16");
                img.setAttribute("title", u);
                img.setAttribute("alt", u);
                div.appendChild(img);
            });

            document.body.appendChild(div);
        }
    }

    //utility
    function arrAnd(arr1, arr2) {
        var result = [];

        arr1.forEach(function(e){
            var idx = arr2.indexOf(e);

            if(idx != -1) {
                result.push(e);
            }
        });

        return result;
    }

    // main
    // http://d.hatena.ne.jp/os0x/20090522/chrome2
    if (window != window.parent) {
        return; //if frame
    }

    if(!document.body || !getUsername()) return;

    GM_xmlhttpRequest({method: "GET",
                       url: 'http://b.hatena.ne.jp/entry/jsonlite/' + location.href.replace(/#/g, "%23"),
                       onload: showFavorites});

    // Commands
    GM_registerMenuCommand('AlwaysHatebuFavorites - update favorites', updateFavorites);
    GM_registerMenuCommand('AlwaysHatebuFavorites - clear cache', clearCache);
})();

