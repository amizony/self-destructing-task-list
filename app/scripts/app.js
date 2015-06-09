taskListApp = angular.module("TaskListApp", ["ui.router","firebase"]);


// ---------------------------------
// Navigation

taskListApp.config(["$stateProvider", "$locationProvider", function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider.state("home", {
    url: "/",
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

taskListApp.run(["TaskManagement", function(TaskManagement) {
  TaskManagement.fetchData();
}]);


// ---------------------------------
// Controllers

taskListApp.controller("ActiveTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.$on("data-loaded", function() {
    buildList();
  });

  $scope.$on("data-edited", function() {
    buildList();
  });

  if (!$scope.tasks) {
    buildList();
  }

  function buildList() {
    setTimeout(function () {
      $scope.$apply(function() {
        $scope.tasks = TaskManagement.getList();
      });
    }, 10);
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

  $scope.$on("data-loaded", function() {
    buildHistory();
  });

  $scope.$on("data-edited", function() {
    buildHistory();
  });

  if (!$scope.history) {
    buildHistory();
  }

  function buildHistory() {
    setTimeout(function () {
      $scope.$apply(function() {
        $scope.history = TaskManagement.getHistory();
      });
    }, 10);
  }

}]);


// ---------------------------------
// Service

taskListApp.service("TaskManagement", ["$rootScope", "$firebaseArray", function($rootScope, $firebaseArray) {

  var ready = false;
  var intervalID;
  $rootScope.$on("data-loaded", function() {
    intervalID = setInterval(clearOldTasks, 1000*6);
    ready = true;
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
        $rootScope.fireBaseTasks.$save(i);
        $rootScope.$broadcast("data-edited");
      }
    }
  };


  return {
    fetchData: function() {
      var ref = new Firebase("https://luminous-fire-9311.firebaseio.com/messages");
      $rootScope.fireBaseTasks = $firebaseArray(ref);

      $rootScope.fireBaseTasks.$loaded(function() {
        $rootScope.$broadcast("data-loaded");
      });
    },
    getList: function() {
      if (!ready) {
        return [];
      } else {
        var list = [];
        var n = $rootScope.fireBaseTasks.length;
        for (var i = 0; i < n; i++) {
          if ($rootScope.fireBaseTasks[i].status == "active") {
            list.push($rootScope.fireBaseTasks[i]);
          }
        }
        return list;
      }
    },

    getHistory: function() {
      if (!ready) {
        return [];
      } else {
        var history = [];
        var ordered = false;
        var reset = false;
        var n = 0;
        // build array of completed and expired tasks
        for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
          if ($rootScope.fireBaseTasks[i].status != "active") {
            history.push($rootScope.fireBaseTasks[i]);
          }
        }

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
      }
    },

    createTask: function(description,priority) {
      var time = new Date();
      $rootScope.fireBaseTasks.$add({
        desc: description,
        date: time.getTime(),
        status: "active",
        priority: priority
      });
      $rootScope.$broadcast("data-edited");
    },

    validateTask: function(id) {
      var time = new Date();
      for (var i = 0; i < $rootScope.fireBaseTasks.length; i++) {
        if ($rootScope.fireBaseTasks[i].$id == id) {
          $rootScope.fireBaseTasks[i].status = "completed";
          $rootScope.fireBaseTasks[i].date = time.getTime();
          $rootScope.fireBaseTasks.$save(i);
          $rootScope.$broadcast("data-edited");
        }
      }
    }

  };

}]);
