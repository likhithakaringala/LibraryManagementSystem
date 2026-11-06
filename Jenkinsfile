pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out Library Management System'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm.cmd ci'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t library-management-system:latest .'
            }
        }
    }

    post {
        success {
            echo 'Library Management System Build Successful'
        }
        failure {
            echo 'Build Failed'
        }
    }
}