pipeline {
    agent any

    environment {
        DOCKER_HUB_USER  = 'douaa2douaa'
        DOCKER_HUB_CREDS = credentials('dockerhub-credentials')
        IMAGE_TAG        = "${BUILD_NUMBER}"
        BACKEND_PATH     = 'C_R_S_Back/credit_management_system'
        FRONTEND_PATH    = 'C_R_S_Front/Front'
        K8S_MASTER       = '20.203.171.108'
        DB_NAME          = 'python'
        DB_USER          = 'root'
        DB_PASSWORD      = 'mohamed12345'
        JWT_SECRET       = '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437'
        AES_KEY          = 'MySecretKey12345MySecretKey12345'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Checkout OK"
            }
        }

        stage('Build Backend Image') {
            steps {
                dir("${BACKEND_PATH}") {
                    bat "docker build -t ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG} ."
                    bat "docker tag ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG} ${DOCKER_HUB_USER}/credit-backend:latest"
                    echo "Backend image OK"
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir("${FRONTEND_PATH}") {
                    bat "docker build --build-arg VITE_API_URL=http://${K8S_MASTER}:30081/api -t ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG} ."
                    bat "docker tag ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG} ${DOCKER_HUB_USER}/credit-frontend:latest"
                    echo "Frontend image OK"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                bat "echo %DOCKER_HUB_CREDS_PSW% | docker login -u %DOCKER_HUB_CREDS_USR% --password-stdin"
                bat "docker push ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG}"
                bat "docker push ${DOCKER_HUB_USER}/credit-backend:latest"
                bat "docker push ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG}"
                bat "docker push ${DOCKER_HUB_USER}/credit-frontend:latest"
                echo "Push Docker Hub OK"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-azure-key']) {
                    bat """
                        ssh -o StrictHostKeyChecking=no azureuser@${K8S_MASTER} "sudo rm -rf /tmp/k8s && mkdir -p /tmp/k8s"
                        scp -o StrictHostKeyChecking=no Kubernetes/namespace.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/mysql.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/backend.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/frontend.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        ssh -o StrictHostKeyChecking=no azureuser@${K8S_MASTER} "sudo kubectl apply -f /tmp/k8s/ -n devops-app && sudo kubectl rollout restart deployment/backend deployment/frontend -n devops-app"
                    """
                }
            }
        }

        stage('Smoke Test') {
            steps {
                bat "curl -f http://${K8S_MASTER}:30080 && echo K8s OK || echo check needed"
            }
        }
    }

    post {
        success {
            echo "Build ${BUILD_NUMBER} SUCCES - K8s: http://${K8S_MASTER}:30080"
        }
        failure {
            echo "Build ${BUILD_NUMBER} ECHEC"
        }
        always {
            bat "docker logout || true"
        }
    }
}