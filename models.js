var mongoose    =   require("mongoose");
mongoose.connect('mongodb://localhost:27017/realchat');

var Schema =  mongoose.Schema;

var userSchema = new Schema({
        username: String,
        createdAt: Date,
        updatedAt: Date,
});

var topicSchema = new Schema({
        title: String,
        creatorId: String,
        createdAt: Date,
        updatedAt: Date,
});

var messageSchema = new Schema({
    username: String,
    topicId: String,
    message: String,
    createdAt: Date,
    updatedAt: Date
});

var User = mongoose.model('User', userSchema);
var Topic = mongoose.model('Topic', topicSchema);
var Message = mongoose.model('Message', messageSchema);

module.exports = {
    User: User,
    Topic: Topic,
    Message: Message
}
