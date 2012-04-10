# Finnish Radio's most played tracks for Spotify

Small proof-of-concept [Spotify](http://www.spotify.com/) application to display playlists of the most popular tracks from websites of Finnish radio stations (NRJ, YleX & Voice).
It uses [YQL](http://developer.yahoo.com/yql/) to get the needed HTML and then converts it to suitable format for the Spotify search API. 
Search results are then added as tracks to dynamically generated playlists.

## Installing

Copy the whole directory to ~/Spotify if you're on OS X and to My Documents/Spotify if you're on Windows.

## Using

Enter to search field:
**spotify:app:finradio**

You have to do this at every time you start Spotify, it won't stay in the sidebar, even if you "Add Application to Sidebar".

You need a [Spotify Preview](http://www.spotify.com/en/download/previews/) version with [Developer Account](https://developer.spotify.com/technologies/apps/).

## Issues

I'm not sure if all of these can be addressed, but fixes are always welcome.

- Sometimes the YQL search can take a while to complete, try switching to other tabs to see if they loaded faster
- It can also fail to load anything, using "Reload application" from right button menu usually helps
- When switching tabs, Spotify occasionally renders just the playlist table with empty content, resizing the window will show the tracks again