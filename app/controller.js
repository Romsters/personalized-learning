﻿define(['durandal/app', 'durandal/activator', 'knockout', 'loader', 'templateSettings', 'entities/course', 'userContext', 'xApi/initializer'], function (app, activator, ko, loader, templateSettings, course, userContext, xApiInitializer) {
    "use strict";

    var self = {
        lifecycle: ['preassessment/viewmodels/index', 'studying/viewmodels/index', 'summary/viewmodels/index']
    };

    var controller = {
        activate: activate
    };

    controller.activeItem = ko.observable();
    controller.activeItem.isComposing = ko.observable(true);

    controller.activeItem.compositionComplete = function () {
        controller.activeItem.isComposing(false);
    };

    return controller;

    function activate() {
        if (course.content) {
            self.lifecycle.unshift('introduction/viewmodels/index');
        }

        if (templateSettings.xApi && templateSettings.xApi.enabled) {
            activateXApi();
        }

        app.on('xApi:authenticated').then(loadModuleAndActivate);
        app.on('xApi:authentication-skipped').then(loadModuleAndActivate);
        app.on('introduction:completed').then(loadModuleAndActivate);
        app.on('preassessment:completed').then(loadModuleAndActivate);
        app.on('studying:completed').then(loadModuleAndActivate);

        return loadModuleAndActivate();
    }

    function loadModuleAndActivate() {
        controller.activeItem.isComposing(true);

        var path = self.lifecycle.shift();
        return loader.loadModule(path).then(function (module) {
            controller.activeItem(module);
        });
    }

    function activateXApi() {
        var user = userContext.getCurrentUser();
        if (user && user.username && /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,6})+)$/.test(user.email)) {
            xApiInitializer.initialize(user.username, use.email);
        } else {
            self.lifecycle.unshift('xApi/viewmodels/login');
        }
    }

});