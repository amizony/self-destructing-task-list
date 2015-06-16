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

  $stateProvider.state("login", {
    url: "/",
    controller: "Login.controller",
    templateUrl: "/templates/login.html"
  });

  $stateProvider.state("home", {
    url: "/home",
    controller: "ActiveTask.controller",
    templateUrl: "/templates/home.html"
  });

  $stateProvider.state("history", {
    url: "/history",
    controller: "PastTask.controller",
    templateUrl: "/templates/history.html"
  });

}]);


// ---------------------------------
// Sync with firebase

taskListApp.run(["TaskManagement", "AuthManagement", function(TaskManagement, AuthManagement) {
  TaskManagement.fetchData();
  AuthManagement.generateToken();
}]);


// ---------------------------------
// Controllers

taskListApp.controller("ActiveTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

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
    $scope.tasks = TaskManagement.getList();
  }

  $scope.addTask = function() {
    TaskManagement.createTask($scope.newTaskDescription,$scope.newTaskPriority);
    $scope.newTaskDescription = "";
    $scope.newTaskPriority = 2;
  };

  $scope.completeTask = function(task) {
    TaskManagement.validateTask(task.$id);
  };

}]);


taskListApp.controller("PastTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.background = {"background-color" : colorForCSS, "border-bottom" : "3px solid" + colorForCSS};
  buildHistory();

  $scope.$on("data-loaded", function() {
    buildHistory();
  });

  $scope.$on("data-edited", function() {
    buildHistory();
  });

  function buildHistory() {
    $scope.history = TaskManagement.getHistory();
  }

}]);


taskListApp.controller("Login.controller", ["$scope", "TaskManagement", "AuthManagement", function($scope, TaskManagement, AuthManagement) {
  $scope.nb = function() {
    AuthManagement.login();
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
      var ref = new Firebase("https://luminous-fire-9311.firebaseio.com/messages");
      $rootScope.fireBaseTasks = $firebaseArray(ref);

      $rootScope.fireBaseTasks.$loaded().then(function() {
        $rootScope.$broadcast("data-loaded");
      });
    },
    getList: function() {
      var list = [];

      // build array of active tasks
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if ($rootScope.fireBaseTasks[i].status == "active") {
          list.push($rootScope.fireBaseTasks[i]);
        }
      }

      return list;
    },

    getHistory: function() {
      var list = [];

      // build array of completed and expired tasks
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if ($rootScope.fireBaseTasks[i].status != "active") {
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

    createTask: function(description, priority) {
      var time = new Date();
      $rootScope.fireBaseTasks.$add({
        desc: description,
        date: time.getTime(),
        status: "active",
        priority: priority
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


taskListApp.service("AuthManagement", ["$rootScope", "$firebaseAuth", function($rootScope, $firebaseAuth) {

  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com");
  var auth = $firebaseAuth(ref);



  return {
    login: function () {
      ref.authWithCustomToken($rootScope.token, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Login Succeeded!", authData);
      }
    });
    },
    generateToken: function() {
      var FirebaseTokenGenerator = require("firebase-token-generator");
      var tokenGenerator = new FirebaseTokenGenerator("qB4QRZgjiuWH2Vv1Sg2KrQy9Yjp40E6pCFSez0Oe");
      $rootScope.token = tokenGenerator.createToken({ uid: "custom:1", some: "arbitrary", data: "here" });
    }
  };
}]);
