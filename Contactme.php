<?php
    require_once ("assets/phpmailer/PHPMailerAutoload.php");
    
    if(isSet($_POST['status']) && $_POST['status'] == 'submit' && isSet($_POST['firstname']) && $_POST['firstname'] != '' && isSet($_POST['lastname']) && $_POST['lastname'] != '' && isSet($_POST['email']) && $_POST['email'] != '' && isSet($_POST['subject']) && $_POST['subject'] != '' && isSet($_POST['message']) && $_POST['message'] != ''){
        $firstname=filter_var($_POST['firstname'], FILTER_SANITIZE_STRING);
        $lastname=filter_var($_POST['lastname'], FILTER_SANITIZE_STRING);
        $email=filter_var($_POST['email'], FILTER_SANITIZE_STRING);
        $subject=filter_var($_POST['subject'], FILTER_SANITIZE_STRING);
        $msg=filter_var($_POST['message'], FILTER_SANITIZE_STRING);

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->SMTPAuth = true;
            $mail->SMTPSecure = 'ssl';
            $mail->Host = 'smtp.gmail.com';
            $mail->Port = '465';
            $mail->IsHTML();
            $mail->Username = 'taha.rhidouani@gmail.com';
            $mail->Password = fgets(fopen("password", "r"));
            $mail->SetFrom('no-reply@taharhidouani.com');
            $mail->Subject = $subject;
            $mail->Body = "<Strong>Name:</Strong> ".$firstname." ".$lastname."<br><Strong>Subject:</Strong> ".$subject."<br><Strong>Email:</Strong> ".$email."<br><br><Strong>Message:</Strong><br>".$msg;
            $mail->AltBody = "Name: ".$firstname." ".$lastname."\nSubject: ".$subject."\nEmail: ".$email."\n\nMessage:\n".$msg;
            $mail->AddAddress('taha.rhidouani@gmail.com');
            $mail->Send();
            echo "Email sent";
        } catch (phpmailerException $e) {
            echo "Error";
        } catch (Exception $e) {
            echo "Error";
        }
        
	} else {
        echo "Empty fields";
    }
?>