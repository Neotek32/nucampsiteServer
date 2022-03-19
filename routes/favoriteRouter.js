const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .populate(["user", "campsites"])
            .then(favorite => {
                res.json(favorite); // res.json assumes statuscode 200 and content type application/json
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    req.body.campsites.forEach(campsite => {
                        if (!favorite.campsites.includes(campsite._id)) {
                            favorite.campsites.push(campsite);
                        }
                    })
                    favorite.save()
                        .then(favorite => {
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                } else {
                    Favorite.create({
                        user: req.user._id,
                        campsites: req.body.campsites
                    })
                        .then(favorite => {
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
        .then(favorite => {
        if (!favorite) {
            res.setHeader('Content-Type', 'text/plain');
            res.end('You do not have any favorites to delete.')
        } else {
            res.json(favorite);
        }
        })
        .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    if (!favorite.campsites.includes(req.params.campsiteId)) {
                        favorite.campsites.push({ _id: req.params.campsiteId });
                        favorite.save()
                            .then(favorite => {
                                res.json(favorite);
                            })
                            .catch(err => next(err));
                    } else {
                        res.setHeader('Content-Type', 'text/plain');
                        res.end("That campsite is already in the list of favorites!")
                    }
                } else {
                    Favorite.create({
                        user: req.user._id,
                        campsites: [{ _id: req.params.campsiteId }]
                    })
                        .then(favorite => {
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
        .then(favorite => {
                if (favorite) {
                    const indexToRemove = favorite.campsites.indexOf(req.params.campsiteId)
                    if (indexToRemove > -1) {
                        favorite.campsites.splice(indexToRemove, 1);
                        favorite.save()
                        .then(favorite => {
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                    } else {
                        // Campsite does not exist in favorite.campsites
                        res.setHeader('Content-Type', 'text/plain');
                        res.end("That campsite is not among your favorites.")
                    }
                } else { // Favorite document does not exist
                    res.setHeader('Content-Type', 'text/plain');
                    res.end("No favorites to delete!")
                }
            }) 
            .catch(err => next(err));
    });

module.exports = favoriteRouter;