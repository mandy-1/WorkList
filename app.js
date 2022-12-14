//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect("mongodb+srv:// " + process.env.AUTH + "@cluster0.longtku.mongodb.net/todolistDB")

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "It's your Todo List"
})
const item2 = new Item({
  name: "Hit + Button below to add new item"
})
const item3 = new Item({
  name: "Check the Check box to delete item."
})

const defaultItems = [item1, item2, item3];

const ListSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List" , ListSchema);

app.get("/", function (req, res) {

  const day = date.getDate();
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Success");
        }
      })
    }
    res.render("list", { listTitle: day, newListItems: foundItems });
  })

});

app.get("/:customListName" , function(req,res){
  const  customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName} , function(err,foundList){
    if(!err){
      if(!foundList){
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        // show existing list
        res.render("list" , {listTitle: foundList.name , newListItems: foundList.items});
      }

    }
  })

  
})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();
  const item = new Item({
    name : itemName
  })

  if(listName === day){
    
    item.save();
    res.redirect("/");
  }
 else{
    List.findOne({name: listName} ,function(e , foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
 }
});

app.post("/delete" , function(req,res){
  const CheckedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();
  if(listName === day){
      Item.findByIdAndRemove(CheckedItemId ,function(err){
      if(!err){
        console.log("deleted element");
        res.redirect("/");
      }
    })
  }
  else{
     List.findOneAndUpdate({name: listName},{$pull :{items: {_id: CheckedItemId}}},function(err , foundList){
        if(!err){
          res.redirect("/"+listName); 
        }
     })
  }
})

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started ");
});
