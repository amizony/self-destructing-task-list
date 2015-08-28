# Task List

A Task list application built during my apprenticeship at [Bloc.io](https://www.bloc.io).

Demo is available on Heroku: [Task-list](http://my-little-task-list.herokuapp.com/).


## Technologies

HTML5 application built with [Grunt](http://gruntjs.com/) and using:
* [Angularjs](https://angularjs.org/)
* [Firebase](https://www.firebase.com/)
* [Sass](http://sass-lang.com/)


## Features

* Persistent tasks, stored on Firebase
* Tasks expire if not completed within one week
* Task can be created with a priority
* History of completed and expired tasks
* Single page application
* User authentication


## Quick start

Install:

1. [Grunt](http://gruntjs.com/): `npm install -g grunt-cli`.

2. Install dependencies : `npm install`.

Run `grunt` to launch a local server you can then access on port 3000 of localhost.


## About the code

I use AngularUI Router to make a single page application.  
The differents HTML blocks, such as the *login bar*, the *active task tab* or the *history tab*, have their own template and controller.
Theses controllers are responsible for the display and the interaction with the user (adding a task or logging in).  
I use then one service to manage the tasks: loading them from Firebase, editing them, or creating new ones.
And another service for managing the users list (stored on Firebase as well) and the authentication process.

Communicating with Firebase is done asynchronous. So each modification from the user is done asynchronously, using a combination of promises and events.

For the authentication, I only used an *username* and no password on purpose, to simplify the access to the app: for testing a new app, it's a lot better not having to provide an email address and a password. The downside of it is that one could access to someone else account just by providing the right *username*.
So when the number of user grows that's something I will add. And that would be easy, because every brick of a secured login in already there.
