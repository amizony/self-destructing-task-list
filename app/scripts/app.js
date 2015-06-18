var colorForCSS = "#3299BB";

taskListApp = angular.module("TaskListApp", ["ui.router","firebase"]);


// ---------------------------------
// Navigation

taskListApp.config(["$stateProvider", "$locationProvider", function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    // @see https://docs.angularjs.org/error/$location/nobase
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
// Sync with firebase

taskListApp.run(["TaskManagement", "AuthManagement", "TaskManagement", function(TaskManagement, AuthManagement, TaskManagement) {
  AuthManagement.fetchUsers();
  TaskManagement.fetchData();
  AuthManagement.unauthentifiedRedirect();
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


taskListApp.controller("Login.controller", ["$scope", "TaskManagement", "AuthManagement", function($scope, TaskManagement, AuthManagement) {

  $scope.uName = AuthManagement.getUserName();
  $scope.name = "";
  $scope.usersReady = AuthManagement.getUserDataStatus();

  $scope.$on("users-loaded", function() {
    $scope.usersReady = true;
    //$scope.$apply(function() {
      //$scope.uName = AuthManagement.getUserName();
    //});
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

  var intervalID;
  $rootScope.$on("data-loaded", function() {
    intervalID = setInterval(clearOldTasks, 1000*60);
  });

  var oneWeek = 1000*60*60*24*7;

  var clearOldTasks = function() {
    var time = new Date();
    console.log("-- Looking for old tasks --");
    for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
      var age = time.getTime() - $rootScope.fireBaseTasks[i].date;
      if ((age > oneWeek) && ($rootScope.fireBaseTasks[i].status == "active")) {
        $rootScope.fireBaseTasks[i].status = "expired";
        $rootScope.fireBaseTasks[i].date += oneWeek;
        $rootScope.fireBaseTasks.$save(i).then(function() {
          $rootScope.$broadcast("data-edited");
        });
      }
    }
  };

  var orderHistory = function(history) {
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
      $rootScope.fireBaseTasks = $firebaseArray(tasksRef);
      $rootScope.fireBaseTasks.$loaded().then(function() {
        $rootScope.$broadcast("data-loaded");
      });
    },
    getList: function(uid) {
      var list = [];

      // build array of active tasks
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if (($rootScope.fireBaseTasks[i].owner == uid) && ($rootScope.fireBaseTasks[i].status == "active")) {
          list.push($rootScope.fireBaseTasks[i]);
        }
      }

      return list;
    },

    getHistory: function(uid) {
      var list = [];

      // build array of completed and expired tasks
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if (($rootScope.fireBaseTasks[i].owner == uid) && ($rootScope.fireBaseTasks[i].status != "active")) {
          list.push($rootScope.fireBaseTasks[i]);
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
      $rootScope.fireBaseTasks.$add({
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
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if ($rootScope.fireBaseTasks[i].$id == id) {
          $rootScope.fireBaseTasks[i].status = "completed";
          $rootScope.fireBaseTasks[i].date = time.getTime();
          $rootScope.fireBaseTasks.$save(i).then(function() {
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

  function generateNewId(uName) {
    var id = uName.toLocaleLowerCase().slice(0,4);
    id += ":";
    id += Math.floor((Math.random() * 1000000000));
    return id;
  }

  function createUser(uName) {
    var id = generateNewId(uName);
    users.$add({
      name: uName,
      uid: id
    }).then(function() {
      $rootScope.$broadcast("users-edited");
    });
    return id;
  }

  function attributeId(uName) {
    var user = lookForUser(uName);
    if (user) {
      return user.uid;
    } else{
      return createUser(uName);
    }
  }

  function lookForUser(uName) {
    for (var i = 0; i < users.length; i++) {;
      if (users[i].name == uName) {
        return users[i];
      }
    }
    return false;
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
    getUserName: function() {
      return currentUser;
    },
    getUserDataStatus: function() {
      return (users !== null);
    },
    getUserId: function () {
      return uid;
    },
    login: function(name) {
      uid = attributeId(name);
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
    unauthentifiedRedirect: function() {
      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        if (error === "AUTH_REQUIRED") {
          $state.go("home");
        }
      });
    }
  };
}]);
