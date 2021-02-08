<?php
    require_once ("assets/phpmailer/PHPMailerAutoload.php");
    
    if(isSet($_POST['status']) && $_POST['status'] == 'submit' && isSet($_POST['firstname']) && $_POST['firstname'] != '' && isSet($_POST['lastname']) && $_POST['lastname'] != '' && isSet($_POST['email']) && $_POST['email'] != '' && isSet($_POST['subject']) && $_POST['subject'] != '' && isSet($_POST['message']) && $_POST['message'] != ''){
        $firstname=$_POST['firstname'];
        $lastname=$_POST['lastname'];
        $email=$_POST['email'];
        $subject=$_POST['subject'];
        $msg=$_POST['message'];

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->SMTPAuth = true;
            $mail->SMTPSecure = 'ssl';
            $mail->Host = 'smtp.gmail.com';
            $mail->Port = '465';
            $mail->IsHTML();
            $mail->Username = 'taha.rhidouani@gmail.com';
            $mail->Password = '***********';
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