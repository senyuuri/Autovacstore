module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {  },
    concat: {  },
    uglify: {  },
    watch:  {  }
  });

  // Load modules from node_modules
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Define tasks

};