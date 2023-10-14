//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

 
app.get("/", function(req, res) {
 
  Item.find({})
  .then(function(foundItems){

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems)
      .then(function(){
      console.log("Successfully saved into our DB.");
      
  })
  .catch(function(err){
    console.log(err);
  });
  res.redirect("/");
    } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
  
  .catch(function(err){
    console.log(err);
  });
});



app.post("/", async (req, res) => {
  let itemName = req.body.newItem
  let listName = req.body.list

  const item = new Item({
      name: itemName,
  })

  if (listName === "Today") {
      item.save()
      res.redirect("/")
  } 
  
  else 
  {
      await List.findOne({ name: listName }).exec()
      
      .then(foundList => {
          foundList.items.push(item)
          foundList.save()
          res.redirect("/" + listName)
      })
      
      .catch(err => {
          console.log(err);
      });
  }
})

app.post("/delete", async (req, res)=> {
  let checkedItemId = req.body.checkbox
  let listName = req.body.listName

  if (listName === "Today") {
    async function deleteItem() 
    {
      const item = await Item.deleteOne({_id: checkedItemId});
    }
    deleteItem();
    res.redirect("/");
  }

  else
  {
    await List.findOne({ name: listName }).exec()
      
      .then(foundList => {
          foundList.items.pull(checkedItemId)
          foundList.save()
          res.redirect("/" + listName)
      })
      
      .catch(err => {
          console.log(err);
      });
  }

});


app.get("/:customListName", function (req, res) 
{
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);

      } 
      else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
