const Sauce = require('../models/Sauce');
const fs = require('fs');


      // CREER UNE SAUCE

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    like: 0, 
    dislike: 0,
    userliked: [],
    userdisliked: []
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};


      // RECUPERER UNE SAUCE

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

      // RECUPERER TOUTES LES SAUCES

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
  .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({error: error});
    });
};


      // MODIFIER

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifié !'}))
      .catch(error => res.status(400).json({ error }));
  };

       // SUPPRIMER

  exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce supprimé !'}))
            .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
  };


        // LIKE - DISLIKE

  exports.likeSauce = (req, res, next) => {
    switch (req.body.like) {

      // Si j'aime = 1, l'utilisateur aime la sauce.
   case 1:
      // Quand 1 like est ajouté, il est associé à l'usersLiked
     Sauce.updateOne({ _id: req.params.id }, {
       $inc: { likes: 1 },
       $push: { usersLiked: req.body.userId },
       _id: req.params.id
     })
       .then(() => { res.status(201).json({ message: 'Ton like a été pris en compte!' }); })
       .catch((error) => { res.status(400).json({ error: error }); });
     break;
     
     // Si j'aime =-1, l'utilisateur n'aime pas la sauce.
   case -1:
     Sauce.updateOne({ _id: req.params.id }, {
       //     Ajouter 1 dislike et pousser usersDisliked
       $inc: { dislikes: 1 },
       $push: { usersDisliked: req.body.userId },
       _id: req.params.id
     })
       .then(() => { res.status(201).json({ message: 'Ton dislike a été pris en compte!' }); })
       .catch((error) => { res.status(400).json({ error: error }); });
     break;

    //  Si j'aime = 0, l'utilisateur annule ce qu'il aime ou ce qu'il n'aime pas.
   case 0:
     Sauce.findOne({ _id: req.params.id })
       .then((sauce) => {
         if (sauce.usersLiked.find(user => user === req.body.userId)) {
           Sauce.updateOne({ _id: req.params.id }, {
             $inc: { likes: -1 },
             $pull: { usersLiked: req.body.userId },
             _id: req.params.id
           })
             .then(() => { res.status(201).json({ message: 'Annulation du like' }); })
             .catch((error) => { res.status(400).json({ error: error }); });

             // Verification que l'utilisateur n'a pas déjà DISLIKER la sauce
         } if (sauce.usersDisliked.find(user => user === req.body.userId)) {
           Sauce.updateOne({ _id: req.params.id }, {
             $inc: { dislikes: -1 },
             $pull: { usersDisliked: req.body.userId },
             _id: req.params.id
           })
             .then(() => { res.status(201).json({ message: 'Annulation du dislike' }); })
             .catch((error) => { res.status(400).json({ error: error }); });
         }
       })
       .catch((error) => { res.status(404).json({ error: error }); });
     break;
   default:
 }
};