const { DataTypes, NUMBER } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("type", {
  
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
  },{
    timestamps: false
  });
};
