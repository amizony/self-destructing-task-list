var colorForCSS = "#3299BB";

taskListApp = angular.module("TaskListApp", ["ui.router","firebase"]);


// ---------------------------------
// Navigation

taskListApp.config(["$stateProvider", "$locationProvider", function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $stateProvider.state("home", {
    url: "/",
    controller: "Login.controller",
    templateUrl: "/templates/home.html"
  });

  $stateProvider.state("tasks", {
    url: "/tasks",
    controller: "ActiveTask.controller",
    templateUrl: "/templates/tasks.html",
    resolve: {
      "currentAuth": ["Auth", function(Auth) {
        return Auth.$requireAuth();
      }]
    }
  });

  $stateProvider.state("history", {
    url: "/history",
    controller: "PastTask.controller",
    templateUrl: "/templates/history.html",
    resolve: {
      "currentAuth": ["Auth", function(Auth) {
        return Auth.$requireAuth();
      }]
    }
  });

}]);


// ---------------------------------
// Sync with firebase & Authentication redirect

taskListApp.run(["TaskManagement", "AuthManagement", "TaskManagement", function(TaskManagement, AuthManagement, TaskManagement) {
  AuthManagement.fetchUsers();
  TaskManagement.fetchData();
  AuthManagement.unauthentifiedRedirect();
  AuthManagement.authentifiedRedirect();
}]);


taskListApp.factory("Auth", ["$firebaseAuth" , function($firebaseAuth) {
  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com");
  return $firebaseAuth(ref);
}]);


// ---------------------------------
// Controllers

taskListApp.controller("ActiveTask.controller", ["$scope", "TaskManagement", "currentAuth", function($scope, TaskManagement, currentAuth) {

  $scope.background = {"background-color" : colorForCSS, "border-bottom" : "3px solid" + colorForCSS};
  $scope.newTaskPriority = 2;
  buildList();

  $scope.$on("data-loaded", function() {
    buildList();
  });

  $scope.$on("data-edited", function() {
    buildList();
  });

  function buildList() {
    $scope.tasks = TaskManagement.getList(currentAuth.uid);
  }

  $scope.addTask = function() {
    TaskManagement.createTask($scope.newTaskDescription, $scope.newTaskPriority, currentAuth.uid);
    $scope.newTaskDescription = "";
    $scope.newTaskPriority = 2;
  };

  $scope.completeTask = function(task) {
    TaskManagement.validateTask(task.$id);
  };

}]);


taskListApp.controller("PastTask.controller", ["$scope", "TaskManagement", "currentAuth", function($scope, TaskManagement, currentAuth) {

  $scope.background = {"background-color" : colorForCSS, "border-bottom" : "3px solid" + colorForCSS};
  buildHistory();

  $scope.$on("data-loaded", function() {
    buildHistory();
  });

  $scope.$on("data-edited", function() {
    buildHistory();
  });

  function buildHistory() {
    $scope.history = TaskManagement.getHistory(currentAuth.uid);
  }

}]);


taskListApp.controller("Login.controller", ["$scope", "AuthManagement", function($scope, AuthManagement) {

  $scope.name = "";
  $scope.usersReady = AuthManagement.getUsersDataStatus();
  $scope.currentUser = AuthManagement.getUserName();

  $scope.$on("users-loaded", function() {
    $scope.usersReady = true;
  });

  $scope.login = function() {
    AuthManagement.login($scope.name);
  };

  $scope.logout = function() {
    AuthManagement.logout();
  };

}]);


// ---------------------------------
// Services

taskListApp.service("TaskManagement", ["$rootScope", "$firebaseArray", function($rootScope, $firebaseArray) {

  var oneWeek = 1000*60*60*24*7;
  var intervalID;
  var firebaseTasks;

  $rootScope.$on("data-loaded", function() {
    intervalID = setInterval(clearOldTasks, 1000*60);
  });

  function clearOldTasks() {
    var time = new Date();
    console.log("-- Looking for old tasks --");
    for (var i = 0; i < firebaseTasks.length; i++) {
      var age = time.getTime() - firebaseTasks[i].date;
      if ((age > oneWeek) && (firebaseTasks[i].status == "active")) {
        firebaseTasks[i].status = "expired";
        firebaseTasks[i].date += oneWeek;
        firebaseTasks.$save(i).then(function() {
          $rootScope.$broadcast("data-edited");
        });
      }
    }
  };

  function orderHistory(history) {
    var ordered = false;
    var reset = false;
    var n = 0;

    // order the history
    while (!ordered) {
      if (history[n].date > history[n+1].date) {
        var temp = history[n];
        history[n] = history[n+1];
        history[n+1] = temp;
        reset = true;
      }
      n += 1;
      if (n == history.length - 1) {
        if (reset) {
          n = 0;
          reset = false;
        } else {
          ordered = true;
        }
      }
    }
    return history;
  };

  return {
    fetchData: function() {
      var tasksRef = new Firebase("https://luminous-fire-9311.firebaseio.com/tasks");
      firebaseTasks = $firebaseArray(tasksRef);
      firebaseTasks.$loaded().then(function() {
        $rootScope.$broadcast("data-loaded");
      });
    },

    getList: function(uid) {
      var list = [];
      // build array of active tasks
      for (var i = 0; i < firebaseTasks.length; i++) {
        if ((firebaseTasks[i].owner == uid) && (firebaseTasks[i].status == "active")) {
          list.push(firebaseTasks[i]);
        }
      }
      return list;
    },

    getHistory: function(uid) {
      var list = [];
      // build array of completed and expired tasks
      for (var i = 0; i < firebaseTasks.length; i++) {
        if ((firebaseTasks[i].owner == uid) && (firebaseTasks[i].status != "active")) {
          list.push(firebaseTasks[i]);
        }
      }
      // order the array and return it
      if (list.length < 2) {
        return list;
      } else {
        return orderHistory(list);
      }
    },

    createTask: function(description, priority, uid) {
      var time = new Date();
      firebaseTasks.$add({
        desc: description,
        date: time.getTime(),
        status: "active",
        priority: priority,
        owner: uid
      }).then(function() {
        $rootScope.$broadcast("data-edited");
      });
    },

    validateTask: function(id) {
      var time = new Date();
      for (var i = 0; i < firebaseTasks.length; i++) {
        if (firebaseTasks[i].$id == id) {
          firebaseTasks[i].status = "completed";
          firebaseTasks[i].date = time.getTime();
          firebaseTasks.$save(i).then(function() {
            $rootScope.$broadcast("data-edited");
          });
        }
      }
    }
  };
}]);



taskListApp.service("AuthManagement", ["$rootScope", "$firebaseAuth", "$firebaseArray", "$state", function($rootScope, $firebaseAuth, $firebaseArray, $state) {

  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com");
  var auth = $firebaseAuth(ref);

  var users = null;
  var token;
  var uid;
  var currentUser = null;


  function attributeUid(uName) {
    var user = lookForUser(uName);
    if (user) {
      // if user exist, then he already has an uid
      return user.uid;
    } else{
      // else we create a new user
      return createUser(uName);
    }
  }

  function lookForUser(uName) {
    // looks if user already exist in database
    for (var i = 0; i < users.length; i++) {;
      if (users[i].name == uName) {
        return users[i];
      }
    }
    return false;
  }

  function createUser(uName) {
    var id = generateNewId(uName);
    users.$add({
      name: uName,
      uid: id
    });
    return id;
  }

  function generateNewId(uName) {
    var uid = uName;
    uid += ":";
    uid += Math.floor((Math.random() * 1000000000));
    return uid;
  }

  function generateToken(id) {
    var FirebaseTokenGenerator = require("firebase-token-generator");
    var tokenGenerator = new FirebaseTokenGenerator("qB4QRZgjiuWH2Vv1Sg2KrQy9Yjp40E6pCFSez0Oe");
    token = tokenGenerator.createToken({ uid: id });
  }

  return {
    fetchUsers: function() {
      var usersRef = new Firebase("https://luminous-fire-9311.firebaseio.com/users");
      users = $firebaseArray(usersRef);
      users.$loaded().then(function() {
        $rootScope.$broadcast("users-loaded");
      });
    },

    unauthentifiedRedirect: function() {
      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        if (error === "AUTH_REQUIRED") {
          $state.go("home");
        }
      });
    },

    authentifiedRedirect: function() {
      if (auth.$getAuth()) {
        currentUser = auth.$getAuth().uid.slice(0,auth.$getAuth().uid.lastIndexOf(":"));
        users.$loaded().then(function() {
          $state.go("tasks");
        });
      }
    },

    getUsersDataStatus: function() {
      return (users !== null);
    },

    login: function(name) {
      uid = attributeUid(name);
      generateToken(uid);
      ref.authWithCustomToken(token, function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          console.log("Login Succeeded!", authData);
          $state.go("tasks");
          currentUser = name;
        }
      });
    },

    logout: function() {
      ref.unauth();
      $state.go("home");
    },

    getUserName: function() {
      return currentUser;
    }

  };
}]);
