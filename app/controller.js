﻿define(['durandal/app', 'durandal/activator', 'knockout', 'loader', 'templateSettings', 'entities/course', 'userContext', 'xApi/initializer', 'eventManager', 'progressContext', 'constants'], function (app, activator, ko, loader, templateSettings, course, userContext, xApiInitializer, eventManager, progressContext, constants) {

    "use strict";

    var self = {
        lifecycle: ['preassessment/viewmodels/index', 'studying/viewmodels/index', 'summary/viewmodels/index']
    };

    var controller = {
        activate: activate

    };

    controller.activeItem = ko.observable();
    controller.activeItem.activationData = ko.observable();
    controller.activeItem.isComposing = ko.observable(true);
    controller.activeItem.id = ko.observable();

    controller.activeItem.compositionComplete = function () {
        controller.activeItem.isComposing(false);
    };
    controller.finish = function () {
        if (controller.activeItem() && controller.activeItem().__moduleId__ === 'preassessment/viewmodels/index') {
            controller.activeItem().answerQuestions();
        }
        self.lifecycle = ['summary/viewmodels/index'];
        return loadModuleAndActivate();
    }

    controller.inProgress = ko.observable(false);

    return controller;

    function activate() {
        app.on('xApi:authenticated').then(loadModuleAndActivate);
        app.on('xApi:authentication-skipped').then(loadModuleAndActivate);
        app.on('introduction:completed').then(loadModuleAndActivate).then(viewChanged);
        app.on('preassessment:completed').then(loadModuleAndActivate).then(viewChanged);;
        app.on('studying:completed').then(loadModuleAndActivate).then(viewChanged);
        app.on('studying:stop-reading').then(stoppedReading);
        var progress = progressContext.get();
        if (course.content) {
            self.lifecycle.unshift('introduction/viewmodels/index');
        }
        if (templateSettings.xApi && templateSettings.xApi.enabled) {
            var user;
            if (_.isFunction(userContext.getCurrentUser)) {
                user  = userContext.getCurrentUser();
            }
            if (user && user.username && (constants.patterns.email.test(user.email) || user.account)) {
                if (_.isObject(progress) && progress.url && progress.user.username === user.username && progress.user.email === user.email) {
                    if (_.isObject(progress.url)) {
                        self.lifecycle = ['studying/viewmodels/index', 'summary/viewmodels/index'];
                    }
                    var index = _.indexOf(self.lifecycle, progress.url) + 1;
                    self.lifecycle = _.rest(self.lifecycle, index);
                }
                else {
                    return xApiInitializer.initialize(user.username, user.email, user.account).then(function () {
                        return eventManager.courseStarted();
                    }).then(function () {
                        return loadModuleAndActivate();
                    });
                }
            }
            if (_.isObject(progress.user)) {
                xApiInitializer.initialize(progress.user.username, progress.user.email, progress.user.account);
            }
            else {
                self.lifecycle.unshift('xApi/viewmodels/login');
            }
        }
        if (_.isObject(progress) && progress.url) {
            if (_.isObject(progress.url)) {
                self.lifecycle = ['studying/viewmodels/index', 'summary/viewmodels/index'];
            }
            var index = _.indexOf(self.lifecycle, progress.url) + 1;
            self.lifecycle = _.rest(self.lifecycle, index);
        }
        return loadModuleAndActivate();

    }

    function loadModuleAndActivate() {

        controller.activeItem.isComposing(true);

        var path = self.lifecycle.shift();

        var progress = progressContext.get();
        controller.activeItem.activationData.call(null, _.isObject(progress.url) ? _.values(progress.url) : progress.url);

        return loader.loadModule(path).then(function (module) {
            controller.activeItem(module);
            controller.inProgress([
                'preassessment/viewmodels/index',
                'studying/viewmodels/index'
            ].indexOf(module.__moduleId__) > -1);
        });
    }

    function viewChanged() {
        var url = controller.activeItem().__moduleId__;
        app.trigger('view:changed', url);
    }

    function stoppedReading() {
        app.trigger('view:changed', 'preassessment/viewmodels/index');
    }

});