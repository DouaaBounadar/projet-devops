pipeline {
    agent any

    environment {
        DOCKER_HUB_USER  = 'douaa2douaa'
        DOCKER_HUB_CREDS = credentials('dockerhub-credentials')
        IMAGE_TAG        = "${BUILD_NUMBER}"
        BACKEND_PATH     = 'C_R_S_Back/credit_management_system'
        FRONTEND_PATH    = 'C_R_S_Front/Front'
        NETWORK          = 'spring-net'
        DB_HOST          = 'mysql-db'
        DB_NAME          = 'python'
        DB_USER          = 'root'
        DB_PASSWORD      = 'mohamed12345'
        JWT_SECRET       = '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437'
        AES_KEY          = 'MySecretKey12345MySecretKey12345'
        DB_URL           = 'jdbc:mysql://mysql-db:3306/python?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
        K8S_MASTER       = '51.107.90.200'
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
                    sh "docker build -t ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG} ."
                    sh "docker tag ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG} ${DOCKER_HUB_USER}/credit-backend:latest"
                    echo "Backend image OK"
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir("${FRONTEND_PATH}") {
                    sh "docker build --build-arg VITE_API_URL=http://${K8S_MASTER}:30080/api -t ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG} ."
                    sh "docker tag ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG} ${DOCKER_HUB_USER}/credit-frontend:latest"
                    echo "Frontend image OK"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${DOCKER_HUB_USER}/credit-backend:${IMAGE_TAG}"
                sh "docker push ${DOCKER_HUB_USER}/credit-backend:latest"
                sh "docker push ${DOCKER_HUB_USER}/credit-frontend:${IMAGE_TAG}"
                sh "docker push ${DOCKER_HUB_USER}/credit-frontend:latest"
                echo "Push Docker Hub OK"
            }
        }

        stage('Deploy Local') {
            steps {
                script {
                    sh "docker network create ${NETWORK} 2>/dev/null || true"
                    sh "docker network connect ${NETWORK} ${DB_HOST} 2>/dev/null || true"
                    sh "docker stop credit-backend credit-frontend 2>/dev/null || true"
                    sh "docker rm credit-backend credit-frontend 2>/dev/null || true"
                    sh "sleep 3"

                    sh """docker run -d \
                      --name credit-backend \
                      --network ${NETWORK} \
                      --restart unless-stopped \
                      -p 8080:8080 \
                      -e 'SPRING_DATASOURCE_URL=${DB_URL}' \
                      -e SPRING_DATASOURCE_USERNAME=${DB_USER} \
                      -e SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD} \
                      -e SPRING_JPA_HIBERNATE_DDL_AUTO=update \
                      -e JWT_SECRET=${JWT_SECRET} \
                      -e JWT_EXPIRATION=86400000 \
                      -e ENCRYPTION_SECRET_KEY=${AES_KEY} \
                      -e CORS_ALLOWED_ORIGINS=http://localhost:3000 \
                      ${DOCKER_HUB_USER}/credit-backend:latest"""

                    sh "sleep 20"

                    sh """docker run -d \
                      --name credit-frontend \
                      --network ${NETWORK} \
                      --restart unless-stopped \
                      -p 3000:80 \
                      ${DOCKER_HUB_USER}/credit-frontend:latest"""

                    echo "Deploy Local OK"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-azure-key']) {
                    sh """
                        # Supprimer avec sudo et recréer avec les bonnes permissions
                        ssh -o StrictHostKeyChecking=no azureuser@${K8S_MASTER} \
                            'sudo rm -rf /tmp/k8s && mkdir -p /tmp/k8s && chmod 777 /tmp/k8s'

                        # Copier les fichiers
                        scp -o StrictHostKeyChecking=no Kubernetes/namespace.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/mysql.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/backend.yaml azureuser@${K8S_MASTER}:/tmp/k8s/
                        scp -o StrictHostKeyChecking=no Kubernetes/frontend.yaml azureuser@${K8S_MASTER}:/tmp/k8s/

                        # Déployer
                        ssh -o StrictHostKeyChecking=no azureuser@${K8S_MASTER} '
                            sudo kubectl apply -f /tmp/k8s/namespace.yaml
                            sudo kubectl apply -f /tmp/k8s/mysql.yaml
                            sudo kubectl apply -f /tmp/k8s/backend.yaml
                            sudo kubectl apply -f /tmp/k8s/frontend.yaml
                            sudo kubectl rollout restart deployment/backend -n credit-app
                            sudo kubectl rollout restart deployment/frontend -n credit-app
                            sudo kubectl get pods -n credit-app
                        '
                    """
                }
            }
        }

        stage('Smoke Test') {
            steps {
                sh "sleep 20"
                sh "curl -f http://localhost:3000 && echo 'Local OK' || echo 'check needed'"
                sh "curl -f http://${K8S_MASTER}:30080 && echo 'K8s OK' || echo 'K8s check needed'"
            }
        }
    }

    post {
        success {
            echo "Build ${BUILD_NUMBER} SUCCES - Local: http://localhost:3000 - K8s: http://${K8S_MASTER}:30080"
        }
        failure {
            sh "docker logs credit-backend --tail 20 2>/dev/null || true"
            echo "Build ${BUILD_NUMBER} ECHEC"
        }
        always {
            sh "docker logout || true"
        }
    }
}
