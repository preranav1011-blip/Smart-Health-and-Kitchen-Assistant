pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_NAME = 'preranav1011/smart-health-kitchen-assistant'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        REGISTRY_CREDENTIALS_ID = 'docker-hub-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'k8s-kubeconfig'
        K8S_NAMESPACE = 'smart-health'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Fetching repository source code..."
                checkout scm
            }
        }

        stage('Run Unit & API Tests') {
            steps {
                echo "Installing test dependencies and running Pytest test suite..."
                dir('backend') {
                    sh '''
                        python3 -m venv test_env
                        . test_env/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                        PYTHONPATH=. pytest tests/ --junitxml=../test-results.xml -v
                    '''
                }
            }
            post {
                always {
                    junit testResults: 'test-results.xml', allowEmptyResults: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker Image: ${IMAGE_NAME}:${IMAGE_TAG}..."
                script {
                    sh """
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest -f backend/Dockerfile ./backend
                    """
                }
            }
        }

        stage('Docker Push') {
            steps {
                echo "Authenticating and pushing image to registry..."
                script {
                    withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo "\$DOCKER_PASS" | docker login ${DOCKER_REGISTRY} -u "\$DOCKER_USER" --password-stdin
                            docker push ${IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying application to Kubernetes cluster in namespace ${K8S_NAMESPACE}..."
                script {
                    withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIALS_ID}", variable: 'KUBECONFIG')]) {
                        sh """
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/secret.yaml -n ${K8S_NAMESPACE}
                            kubectl apply -f k8s/configmap.yaml -n ${K8S_NAMESPACE}
                            kubectl apply -f k8s/mysql-pv-pvc.yaml -n ${K8S_NAMESPACE}
                            kubectl apply -f k8s/mysql-deployment.yaml -n ${K8S_NAMESPACE}
                            kubectl apply -f k8s/mysql-service.yaml -n ${K8S_NAMESPACE}

                            # Update backend deployment with latest build tag
                            kubectl set image deployment/backend-deployment backend=${IMAGE_NAME}:${IMAGE_TAG} -n ${K8S_NAMESPACE} --local -o yaml | kubectl apply -f -
                            kubectl apply -f k8s/backend-service.yaml -n ${K8S_NAMESPACE}
                            kubectl apply -f k8s/ingress.yaml -n ${K8S_NAMESPACE}

                            # Await rollout completion
                            kubectl rollout status deployment/backend-deployment -n ${K8S_NAMESPACE} --timeout=120s
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully! Build ${env.BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline failed on build ${env.BUILD_NUMBER}. Please check logs and test results."
        }
        always {
            cleanWs()
        }
    }
}
