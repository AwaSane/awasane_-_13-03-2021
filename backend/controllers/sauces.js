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
    // Si j'aime = 1, l'utilisateur aime la sauce. 
    if (req.body.like === 1) {
        Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ },
          $push: { usersLiked: req.body.userId } }) // on ajoute 1 like et on le push l'array usersLiked
            .then(() => res.status(200).json({ message: 'Like ajouté!' }))
            .catch(error => res.status(400).json({ error }));
      // Si j'aime =-1, l'utilisateur n'aime pas la sauce.
    } else if (req.body.like === -1) { 
        Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 },
         //     Ajouter 1 dislike et pousser usersDisliked
        $push: { usersDisliked: req.body.userId } })
            .then(() => res.status(200).json({ message: 'Dislike ajouté!' }))
            .catch(error => res.status(400).json({ error }));
      //  Si j'aime = 0, l'utilisateur annule ce qu'il aime ou ce qu'il n'aime pas.
    } else {
        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
              // Si userLiked comprend l'id
                if (sauce.usersLiked.includes(req.body.userId)) { 
                  // $pull sert a retirer l'userLiked et le like
                    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } }) 
                        .then(() => { res.status(200).json({ message: 'Annulation du like' }) })
                        .catch(error => res.status(400).json({ error }))
                          // Si userDisliked comprend l'id
                } else if (sauce.usersDisliked.includes(req.body.userId)) {
                    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                        .then(() => { res.status(200).json({ message: 'Annulation du dislike' }) })
                        .catch(error => res.status(400).json({ error }))
                }
            })
            .catch(error => res.status(400).json({ error }));
    }
};